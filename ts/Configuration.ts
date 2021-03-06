import fs from "fs-extra";
import path from "path";
import inquirer from "inquirer";

export interface ConfigurationStruct {
  hue: {
    user: string | null;
    ip: string | null;
    group: string | number | undefined | null;
    acknowledgedShittyGroup: boolean | undefined;
  };
  presenti: {
    endpoint: string | null;
    scope: string | null;
    neutralColor: string | null;
  };
  web: {
    passwordHash: string | null;
    cookieKey: string | null;
    enabled: boolean | null;
    port: number | null;
  }
}

const DEFAULT_CONFIG: ConfigurationStruct = {
  hue: {
    user: null,
    ip: null,
    group: null,
    acknowledgedShittyGroup: undefined
  },
  presenti: {
    endpoint: null,
    scope: null,
    neutralColor: '#ffffed'
  },
  web: {
    passwordHash: null,
    cookieKey: null,
    enabled: null,
    port: null
  }
}

export const CONFIG_PATH = path.resolve(__dirname, "..", "hue.config.json");

export const CONFIG: ConfigurationStruct = fs.pathExistsSync(CONFIG_PATH) ? fs.readJsonSync(CONFIG_PATH) : (fs.writeJsonSync(CONFIG_PATH, DEFAULT_CONFIG, { spaces: 4 }), JSON.parse(JSON.stringify(DEFAULT_CONFIG)));

export const saveConfig = () => fs.writeJson(CONFIG_PATH, CONFIG, { spaces: 4 });

export const ui = new inquirer.ui.BottomBar();