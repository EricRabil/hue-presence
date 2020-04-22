import { PresenceStream } from "remote-presence-connector";
import inquirer from "inquirer";
import { CONFIG, saveConfig } from "./Configuration";
import { EventEmitter } from "events";

export declare interface PresentiController {
  on(event: "background", fn: (color: {color: string, transition: number}) => any): this;
  on(event: string | Symbol, fn: (...args: any[]) => any): this;

  emit(event: "background", data: (color: {color: string, transition: number}) => any): boolean;
  emit(event: string | Symbol, ...args: any[]): boolean;
}

interface PresenceState {
  gradient?: {
    color?: string;
    transition?: string;
  };
}

/**
 * Wrapper around PresenceStream for listening to gradient state changes
 */
export class PresentiController extends EventEmitter {
  stream: PresenceStream;

  /**
   * Initialize the controller
   */
  async initialize() {
    // prompt the user for endpoint/scope
    if (!this.endpoint || !this.scope) {
      if (!this.endpoint) {
        this.endpoint = await inquirer.prompt({
          type: 'input',
          name: 'endpoint',
          message: 'What is your Presenti endpoint?',
          default: 'ws://127.0.0.1:8138/presence/'
        }).then(results => results.endpoint);
      }

      if (!this.scope) {
        this.scope = await inquirer.prompt({
          type: 'input',
          name: 'scope',
          message: 'What is your Presenti scope?',
          default: 'eric'
        }).then(results => results.scope);
      }

      await saveConfig();
    }

    if (!this.endpoint || !this.scope) {
      throw new Error("Failed to configure endpoint and scope.");
    }

    // connect to presenti api
    this.stream = new PresenceStream(this.scope, { url: this.endpoint });
    this.stream.on('state', (state: PresenceState) => {
      if (state.gradient?.color && state.gradient?.transition) {
        // emit state change
        this.emit("background",  { color: state.gradient.color, transition: state.gradient.transition });
      }
    });

    this.stream.connect();
  }

  get scope() {
    return CONFIG.presenti.scope;
  }

  set scope(scope: string | null) {
    CONFIG.presenti.scope = scope;
  }

  get endpoint() {
    return CONFIG.presenti.endpoint;
  }

  set endpoint(endpoint: string | null) {
    CONFIG.presenti.endpoint = endpoint;
  }
}