import inquirer from "inquirer";
import { v3 } from "node-hue-api";
import Api, { Light } from "node-hue-api/lib/api/Api";
import { LightGroup } from "node-hue-api/lib/api/Groups";
import { getColorGamut } from "node-hue-api/lib/model/colorGamuts";
import GroupState from "node-hue-api/lib/model/lightstate/GroupState";
import LightState from "node-hue-api/lib/model/lightstate/LightState";
import { rgbToXY } from "node-hue-api/lib/rgb";
import { CONFIG, saveConfig } from "./Configuration";

interface BridgeStruct {
  name: string;
  ipaddress: string;
  manufacturer?: string;
  modelid?: string;
  swversion?: string;
  model?: {
    number: string;
    description: string;
    name: string;
    serial: string;
  };
  version?: {
    major: string;
    minor: string;
  };
  icons?: {
    mimetype: string;
    height: string;
    width: string;
    depth: string;
    url: string;
  }[];
}

function hexToRgb(hex: string) {
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
export class HueController {
  api: Api;
  lights: Light[] = [];

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
    this.api = await v3.api.createLocal(this.ip).connect(this.user);

    // set group if missing
    if (!this.group) {
      this.group = await this.selectGroup().then(group => group?.id);
    }

    if (!this.group) {
      throw new Error('Missing group');
    }

    // load in lights
    await this.populateLights();

    // check if all the lights have the same gamut. if not, yell at person running this software.
    if (this.requiresIndividualConversion && !this.acknowledgedShittyGroup) {
      const { proceed } = await inquirer.prompt({
        type: 'confirm',
        name: 'proceed',
        message: 'Hey! Not all of your lights are on the same color gamut. This means each light will have to be updated in an individual REST request, as Hue does not have an API for bulk updates. This may not look pretty. You should probably select a group with lights that all use the same gamut. Would you like to continue anyway?'
      });

      if (!proceed) {
        process.exit();
      }

      this.acknowledgedShittyGroup = true;
    }

    await saveConfig();
  }

  /**
   * Sets all lights in the group to a given hex color, with a transition in milliseconds
   * @param color hex color
   * @param transition transition in milliseconds
   */
  async updateToColor(color: string, transition: number) {
    if (!this.group) {
      throw new Error('Missing group');
    }

    const { r, g, b } = hexToRgb(color) || {};

    if (typeof r === "undefined") return;

    if (this.requiresIndividualConversion) {
      await Promise.all(this.lights.map(async ({ id, colorGamut }) => {
        const [x, y] = rgbToXY([r, g, b], colorGamut);

        await this.api.lights.setLightState(id, new LightState().xy(x, y).transition(transition));
      }));
    } else {
      const [x, y] = rgbToXY([r, g, b], this.gamut);

      await this.api.groups.setGroupState(this.group, new GroupState().xy(x, y).transition(transition));
    }
  }

  /**
   * Loads light data for the group
   */
  private async populateLights() {
    const lightGroup: LightGroup = await this.api.groups.getGroup(this.group);
    const lightIDs: string[] = lightGroup.lights;
    this.lights = await Promise.all(lightIDs.map(id => this.api.lights.getLight(parseInt(id))));
  }

  /**
   * Prompt the user to select a group
   */
  private async selectGroup() {
    if (!this.ip || !this.user || !this.api) return null;

    const groups = await this.api.groups.getAll();

    const { group: groupName } = await inquirer.prompt(
      [
        {
          type: 'list',
          name: 'group',
          message: 'Which group would you like to use for dynamic color?',
          choices: groups.map(group => group.name)
        }
      ]
    );

    return groups.find(group => group.name === groupName);
  }

  /**
   * Prompt the user to press the link button, and create a user with the authorization
   */
  private async createUser() {
    if (!this.ip) return null;

    const api = await v3.api.createLocal(this.ip).connect();

    await inquirer.prompt({
      type: 'confirm',
      name: 'link',
      message: 'Press the link button on your Hue Bridge, and confirm when you\'ve done that.'
    });

    const user: { username: string } = await api.users.createUser('hue-presence', 'erics-mbp');

    return user;
  }

  get acknowledgedShittyGroup() {
    return CONFIG.hue.acknowledgedShittyGroup;
  }

  set acknowledgedShittyGroup(acknowledgedShittyGroup) {
    CONFIG.hue.acknowledgedShittyGroup = acknowledgedShittyGroup;
  }

  get gamut() {
    return (this.gamuts.length === 1 && getColorGamut(this.gamuts[0])) || null;
  }

  get gamuts() {
    return this.lights.map(light => light.mappedColorGamut).filter((gamut, idx, arr) => arr.indexOf(gamut) === idx);
  }

  get requiresIndividualConversion() {
    return this.gamuts.length > 1;
  }

  get group() {
    return CONFIG.hue.group;
  }

  set group(group) {
    CONFIG.hue.group = group;
  }

  get ip() {
    return CONFIG.hue.ip;
  }

  set ip(ipAddress) {
    CONFIG.hue.ip = ipAddress;
  }

  get user() {
    return CONFIG.hue.user;
  }

  set user(user) {
    CONFIG.hue.user = user;
  }

  /**
   * Prompt the user to select a bridge
   */
  static async selectBridge() {
    const bridgeData = await this.bridges();
    const { selection } = await inquirer.prompt(
      [
        {
          type: 'list',
          name: 'selection',
          message: 'Which bridge do you want to connect to?',
          choices: bridgeData.map(bridge => `${bridge.name} (${bridge.ipaddress})`)
        }
      ]
    );

    return bridgeData.find(bridgeCmp => `${bridgeCmp.name} (${bridgeCmp.ipaddress})` === selection) || null;
  }

  /**
   * List all available bridges using the non-uPnP API
   */
  static async bridges(): Promise<BridgeStruct[]> {
    return v3.discovery.nupnpSearch();
  }
}