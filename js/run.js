"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Hue_1 = require("./Hue");
const Presenti_1 = require("./Presenti");
const hueController = new Hue_1.HueController();
const presentiController = new Presenti_1.PresentiController();
hueController.initialize().then(() => {
    presentiController.initialize().then(() => {
        presentiController.on("background", ({ color, transition }) => {
            hueController.updateToColor(color, transition);
        });
    });
});
