"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Hue_1 = require("./Hue");
const Presenti_1 = require("./Presenti");
const Web_1 = require("./Web");
const hueController = new Hue_1.HueController();
const presentiController = new Presenti_1.PresentiController();
const webController = new Web_1.WebController();
hueController.initialize().then(async () => {
    await presentiController.initialize();
    await webController.initialize(hueController, presentiController);
    presentiController.on("background", ({ color, transition }) => {
        hueController.updateToColor(color, transition);
    });
});
