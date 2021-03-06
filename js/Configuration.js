"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_extra_1 = __importDefault(require("fs-extra"));
const path_1 = __importDefault(require("path"));
const inquirer_1 = __importDefault(require("inquirer"));
const DEFAULT_CONFIG = {
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
};
exports.CONFIG_PATH = path_1.default.resolve(__dirname, "..", "hue.config.json");
exports.CONFIG = fs_extra_1.default.pathExistsSync(exports.CONFIG_PATH) ? fs_extra_1.default.readJsonSync(exports.CONFIG_PATH) : (fs_extra_1.default.writeJsonSync(exports.CONFIG_PATH, DEFAULT_CONFIG, { spaces: 4 }), JSON.parse(JSON.stringify(DEFAULT_CONFIG)));
exports.saveConfig = () => fs_extra_1.default.writeJson(exports.CONFIG_PATH, exports.CONFIG, { spaces: 4 });
exports.ui = new inquirer_1.default.ui.BottomBar();
