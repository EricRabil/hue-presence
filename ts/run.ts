import { HueController } from "./Hue";
import { PresentiController } from "./Presenti";
import { WebController } from "./Web";

const hueController = new HueController();
const presentiController = new PresentiController();
const webController = new WebController();

hueController.initialize().then(async () => {
  await presentiController.initialize();
  await webController.initialize(hueController, presentiController);
  
  presentiController.on("background", ({ color, transition }) => {
    hueController.updateToColor(color, transition);
  });
});