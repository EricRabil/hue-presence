import bcrypt from "bcrypt";
import bodyParser from "body-parser";
import cookieSession from "cookie-session";
import express from "express";
import inquirer from "inquirer";
import path from "path";
import { CONFIG, saveConfig, ui } from "./Configuration";
import { AuthenticatedRouter } from "./routes/authenticated";
import { UnauthenticatedRouter } from "./routes/unauthenticated";
import morgan from "morgan";
import { HueController } from "./Hue";
import { PresentiController } from "./Presenti";

class WebControllerDisabledError extends Error {

}

export class WebController {
  app: express.Express;

  async initialize(hueController: HueController, presentiController: PresentiController) {
    try {
      await this.runConfiguration();
    } catch (e) {
      if (e instanceof WebControllerDisabledError) return;
      throw e;
    }

    this.app = express();

    this.app.set("view engine", "pug");
    this.app.set("views", path.resolve(__dirname, "..", "views"));

    this.app.use(morgan('combined'));

    this.app.use(express.static(path.resolve(__dirname, "..", "assets")));
    
    this.app.use(cookieSession({
      name: 'session',
      keys: [this.cookieKey!],

      // Cookie Options
      maxAge: 7 * 24 * 60 * 60 * 1000
    }));

    this.app.use(bodyParser.json());
    this.app.use(bodyParser.urlencoded({ extended: true }));

    this.app.use((req, res, next) => {
      req.controllers = {} as any;
      req.controllers.web = this;
      req.controllers.presenti = presentiController;
      req.controllers.hue = hueController;

      next();
    });

    this.app.get('/', (req, res) => {
      if (req.session?.authenticated) {
        res.redirect('/admin/panel');
      } else {
        res.redirect('/login');
      }
    });

    this.app.use('/admin', AuthenticatedRouter);
    this.app.use(UnauthenticatedRouter);

    await new Promise(resolve => this.app.listen(this.port!, resolve));

    ui.log.write(`Web server is listening on port ${this.port}`);
  }

  private async runConfiguration() {
    let changed = false;

    if (typeof this.enabled !== "boolean") {
      this.enabled = await inquirer.prompt([
        {
          type: "confirm",
          name: "enabled",
          message: "Enable web panel?"
        }
      ]).then(res => res.enabled);

      changed = true;
    }

    if (!this.enabled) {
      await saveConfig();
      throw new WebControllerDisabledError();
    }

    if (!this.hash) {
      const { password } = await inquirer.prompt([
        {
          type: "password",
          name: "password",
          message: "Please choose an admin password. This will be hashed and stored."
        }
      ]);

      this.hash = await bcrypt.hash(password, 10);
      changed = true;
    }

    if (!this.port) {
      this.port = await inquirer.prompt([{
        type: "number",
        name: "port",
        message: "What port will the admin password run on?",
        default: 9192
      }]).then(res => res.port);
    }

    if (!this.cookieKey) {
      ui.log.write('Generating cookie signature key for express');

      this.cookieKey = await bcrypt.genSalt(10);
      changed = true;
    }

    if (changed) {
      await saveConfig();
    }
  }

  get enabled() {
    return CONFIG.web.enabled;
  }

  set enabled(enabled) {
    CONFIG.web.enabled = enabled;
  }

  get cookieKey() {
    return CONFIG.web.cookieKey;
  }

  set cookieKey(key) {
    CONFIG.web.cookieKey = key;
  }

  get hash() {
    return CONFIG.web.passwordHash;
  }

  set hash(hash) {
    CONFIG.web.passwordHash = hash;
  }

  get port() {
    return CONFIG.web.port;
  }

  set port(port) {
    CONFIG.web.port = port;
  }
}