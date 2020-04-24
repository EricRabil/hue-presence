"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const bcrypt_1 = __importDefault(require("bcrypt"));
const body_parser_1 = __importDefault(require("body-parser"));
const cookie_session_1 = __importDefault(require("cookie-session"));
const express_1 = __importDefault(require("express"));
const inquirer_1 = __importDefault(require("inquirer"));
const path_1 = __importDefault(require("path"));
const Configuration_1 = require("./Configuration");
const authenticated_1 = require("./routes/authenticated");
const unauthenticated_1 = require("./routes/unauthenticated");
const morgan_1 = __importDefault(require("morgan"));
class WebControllerDisabledError extends Error {
}
class WebController {
    async initialize(hueController, presentiController) {
        try {
            await this.runConfiguration();
        }
        catch (e) {
            if (e instanceof WebControllerDisabledError)
                return;
            throw e;
        }
        this.app = express_1.default();
        this.app.set("view engine", "pug");
        this.app.set("views", path_1.default.resolve(__dirname, "..", "views"));
        this.app.use(morgan_1.default('combined'));
        this.app.use(express_1.default.static(path_1.default.resolve(__dirname, "..", "assets")));
        this.app.use(cookie_session_1.default({
            name: 'session',
            keys: [this.cookieKey],
            // Cookie Options
            maxAge: 7 * 24 * 60 * 60 * 1000
        }));
        this.app.use(body_parser_1.default.json());
        this.app.use(body_parser_1.default.urlencoded({ extended: true }));
        this.app.use((req, res, next) => {
            req.controllers = {};
            req.controllers.web = this;
            req.controllers.presenti = presentiController;
            req.controllers.hue = hueController;
            next();
        });
        this.app.get('/', (req, res) => {
            var _a;
            if ((_a = req.session) === null || _a === void 0 ? void 0 : _a.authenticated) {
                res.redirect('/admin/panel');
            }
            else {
                res.redirect('/login');
            }
        });
        this.app.use('/admin', authenticated_1.AuthenticatedRouter);
        this.app.use(unauthenticated_1.UnauthenticatedRouter);
        await new Promise(resolve => this.app.listen(this.port, resolve));
        Configuration_1.ui.log.write(`Web server is listening on port ${this.port}`);
    }
    async runConfiguration() {
        let changed = false;
        if (typeof this.enabled !== "boolean") {
            this.enabled = await inquirer_1.default.prompt([
                {
                    type: "confirm",
                    name: "enabled",
                    message: "Enable web panel?"
                }
            ]).then(res => res.enabled);
            changed = true;
        }
        if (!this.enabled) {
            await Configuration_1.saveConfig();
            throw new WebControllerDisabledError();
        }
        if (!this.hash) {
            const { password } = await inquirer_1.default.prompt([
                {
                    type: "password",
                    name: "password",
                    message: "Please choose an admin password. This will be hashed and stored."
                }
            ]);
            this.hash = await bcrypt_1.default.hash(password, 10);
            changed = true;
        }
        if (!this.port) {
            this.port = await inquirer_1.default.prompt([{
                    type: "number",
                    name: "port",
                    message: "What port will the admin password run on?",
                    default: 9192
                }]).then(res => res.port);
        }
        if (!this.cookieKey) {
            Configuration_1.ui.log.write('Generating cookie signature key for express');
            this.cookieKey = await bcrypt_1.default.genSalt(10);
            changed = true;
        }
        if (changed) {
            await Configuration_1.saveConfig();
        }
    }
    get enabled() {
        return Configuration_1.CONFIG.web.enabled;
    }
    set enabled(enabled) {
        Configuration_1.CONFIG.web.enabled = enabled;
    }
    get cookieKey() {
        return Configuration_1.CONFIG.web.cookieKey;
    }
    set cookieKey(key) {
        Configuration_1.CONFIG.web.cookieKey = key;
    }
    get hash() {
        return Configuration_1.CONFIG.web.passwordHash;
    }
    set hash(hash) {
        Configuration_1.CONFIG.web.passwordHash = hash;
    }
    get port() {
        return Configuration_1.CONFIG.web.port;
    }
    set port(port) {
        Configuration_1.CONFIG.web.port = port;
    }
}
exports.WebController = WebController;
