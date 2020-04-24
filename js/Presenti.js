"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const events_1 = require("events");
const inquirer_1 = __importDefault(require("inquirer"));
const remote_presence_connector_1 = require("remote-presence-connector");
const Configuration_1 = require("./Configuration");
/**
 * Wrapper around PresenceStream for listening to gradient state changes
 */
class PresentiController extends events_1.EventEmitter {
    /**
     * Initialize the controller
     */
    async initialize() {
        // prompt the user for endpoint/scope
        if (!this.endpoint || !this.scope) {
            if (!this.endpoint) {
                this.endpoint = await inquirer_1.default.prompt({
                    type: 'input',
                    name: 'endpoint',
                    message: 'What is your Presenti endpoint?',
                    default: 'ws://127.0.0.1:8138/presence/'
                }).then(results => results.endpoint);
            }
            if (!this.scope) {
                this.scope = await inquirer_1.default.prompt({
                    type: 'input',
                    name: 'scope',
                    message: 'What is your Presenti scope?',
                    default: 'eric'
                }).then(results => results.scope);
            }
            await Configuration_1.saveConfig();
        }
        if (!this.endpoint || !this.scope) {
            throw new Error("Failed to configure endpoint and scope.");
        }
        var opened;
        // connect to presenti api
        this.stream = new remote_presence_connector_1.PresenceStream(this.scope, { url: this.endpoint });
        this.stream.on('state', (state) => {
            var _a, _b, _c;
            if ((_a = state.gradient) === null || _a === void 0 ? void 0 : _a.paused) {
                this.emit("background", { color: this.neutralColor, transition: 2000 });
                return;
            }
            if (((_b = state.gradient) === null || _b === void 0 ? void 0 : _b.color) && ((_c = state.gradient) === null || _c === void 0 ? void 0 : _c.transition)) {
                // emit state change
                this.emit("background", { color: state.gradient.color, transition: state.gradient.transition });
            }
        }).on('state', opened = () => {
            this.stream.off('state', opened);
        });
        this.stream.connect();
    }
    conncet() {
        this.stream.connect();
    }
    disconnect() {
        this.stream.close();
    }
    get neutralColor() {
        return Configuration_1.CONFIG.presenti.neutralColor;
    }
    get connected() {
        if (!this.stream.socket)
            return false;
        return this.stream.socket.readyState === this.stream.socket.OPEN;
    }
    get scope() {
        return Configuration_1.CONFIG.presenti.scope;
    }
    get url() {
        return this.stream.url;
    }
    set scope(scope) {
        Configuration_1.CONFIG.presenti.scope = scope;
    }
    get endpoint() {
        return Configuration_1.CONFIG.presenti.endpoint;
    }
    set endpoint(endpoint) {
        Configuration_1.CONFIG.presenti.endpoint = endpoint;
    }
}
exports.PresentiController = PresentiController;
