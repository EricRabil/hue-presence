"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const inquirer_1 = __importDefault(require("inquirer"));
const node_hue_api_1 = require("node-hue-api");
const colorGamuts_1 = require("node-hue-api/lib/model/colorGamuts");
const GroupState_1 = __importDefault(require("node-hue-api/lib/model/lightstate/GroupState"));
const LightState_1 = __importDefault(require("node-hue-api/lib/model/lightstate/LightState"));
const rgb_1 = require("node-hue-api/lib/rgb");
const Configuration_1 = require("./Configuration");
function hexToRgb(hex) {
    var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
    } : null;
}
/**
 * Wrapper around node-hue-api for issuing hex color changes with a transition
 */
class HueController {
    constructor() {
        this.lights = [];
        this.rotating = true;
    }
    /**
     * Connect to api, do any necessary auth
     */
    async initialize() {
        // prompt user for ip, press button, create user
        if (!this.ip || !this.user) {
            if (!this.ip) {
                const { ipaddress } = await HueController.selectBridge() || {};
                this.ip = ipaddress || null;
            }
            if (!this.user) {
                const { username } = await this.createUser() || {};
                this.user = username || null;
            }
        }
        if (!this.ip || !this.user) {
            throw new Error('Missing Bridge IP or username');
        }
        // conncet to api
        this.api = await node_hue_api_1.v3.api.createLocal(this.ip).connect(this.user);
        // set group if missing
        if (!this.group) {
            this.group = await this.selectGroup().then(group => { var _a; return (_a = group) === null || _a === void 0 ? void 0 : _a.id; });
        }
        if (!this.group) {
            throw new Error('Missing group');
        }
        // load in lights
        await this.populateLights();
        // check if all the lights have the same gamut. if not, yell at person running this software.
        if (this.requiresIndividualConversion && !this.acknowledgedShittyGroup) {
            const { proceed } = await inquirer_1.default.prompt({
                type: 'confirm',
                name: 'proceed',
                message: 'Hey! Not all of your lights are on the same color gamut. This means each light will have to be updated in an individual REST request, as Hue does not have an API for bulk updates. This may not look pretty. You should probably select a group with lights that all use the same gamut. Would you like to continue anyway?'
            });
            if (!proceed) {
                process.exit();
            }
            this.acknowledgedShittyGroup = true;
        }
        await Configuration_1.saveConfig();
        Configuration_1.ui.log.write('Connected to the Hue API');
    }
    /**
     * Sets all lights in the group to a given hex color, with a transition in milliseconds
     * @param color hex color
     * @param transition transition in milliseconds
     */
    async updateToColor(color, transition, force = false) {
        if (!this.group) {
            throw new Error('Missing group');
        }
        if (!this.rotating && !force)
            return;
        const { r, g, b } = hexToRgb(color) || {};
        if (typeof r === "undefined")
            return;
        if (this.requiresIndividualConversion) {
            await Promise.all(this.lights.map(async ({ id, colorGamut }) => {
                const [x, y] = rgb_1.rgbToXY([r, g, b], colorGamut);
                await this.api.lights.setLightState(id, new LightState_1.default().xy(x, y).transition(transition));
            }));
        }
        else {
            const [x, y] = rgb_1.rgbToXY([r, g, b], this.gamut);
            await this.api.groups.setGroupState(this.group, new GroupState_1.default().xy(x, y).transition(transition));
        }
    }
    /**
     * Loads light data for the group
     */
    async populateLights() {
        const lightGroup = await this.api.groups.getGroup(this.group);
        const lightIDs = lightGroup.lights;
        this.lights = await Promise.all(lightIDs.map(id => this.api.lights.getLight(parseInt(id))));
    }
    /**
     * Prompt the user to select a group
     */
    async selectGroup() {
        if (!this.ip || !this.user || !this.api)
            return null;
        const groups = await this.api.groups.getAll();
        const { group: groupName } = await inquirer_1.default.prompt([
            {
                type: 'list',
                name: 'group',
                message: 'Which group would you like to use for dynamic color?',
                choices: groups.map(group => group.name)
            }
        ]);
        return groups.find(group => group.name === groupName);
    }
    /**
     * Prompt the user to press the link button, and create a user with the authorization
     */
    async createUser() {
        if (!this.ip)
            return null;
        const api = await node_hue_api_1.v3.api.createLocal(this.ip).connect();
        await inquirer_1.default.prompt({
            type: 'confirm',
            name: 'link',
            message: 'Press the link button on your Hue Bridge, and confirm when you\'ve done that.'
        });
        const user = await api.users.createUser('hue-presence', 'erics-mbp');
        return user;
    }
    get acknowledgedShittyGroup() {
        return Configuration_1.CONFIG.hue.acknowledgedShittyGroup;
    }
    set acknowledgedShittyGroup(acknowledgedShittyGroup) {
        Configuration_1.CONFIG.hue.acknowledgedShittyGroup = acknowledgedShittyGroup;
    }
    get gamut() {
        return (this.gamuts.length === 1 && colorGamuts_1.getColorGamut(this.gamuts[0])) || null;
    }
    get gamuts() {
        return this.lights.map(light => light.mappedColorGamut).filter((gamut, idx, arr) => arr.indexOf(gamut) === idx);
    }
    get requiresIndividualConversion() {
        return this.gamuts.length > 1;
    }
    get group() {
        return Configuration_1.CONFIG.hue.group;
    }
    set group(group) {
        Configuration_1.CONFIG.hue.group = group;
    }
    get ip() {
        return Configuration_1.CONFIG.hue.ip;
    }
    set ip(ipAddress) {
        Configuration_1.CONFIG.hue.ip = ipAddress;
    }
    get user() {
        return Configuration_1.CONFIG.hue.user;
    }
    set user(user) {
        Configuration_1.CONFIG.hue.user = user;
    }
    /**
     * Prompt the user to select a bridge
     */
    static async selectBridge() {
        const bridgeData = await this.bridges();
        const { selection } = await inquirer_1.default.prompt([
            {
                type: 'list',
                name: 'selection',
                message: 'Which bridge do you want to connect to?',
                choices: bridgeData.map(bridge => `${bridge.name} (${bridge.ipaddress})`)
            }
        ]);
        return bridgeData.find(bridgeCmp => `${bridgeCmp.name} (${bridgeCmp.ipaddress})` === selection) || null;
    }
    /**
     * List all available bridges using the non-uPnP API
     */
    static async bridges() {
        return node_hue_api_1.v3.discovery.nupnpSearch();
    }
}
exports.HueController = HueController;
