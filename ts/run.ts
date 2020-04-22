import { HueController } from "./Hue";
import { PresentiController } from "./Presenti";

const hueController = new HueController();
const presentiController = new PresentiController();

hueController.initialize().then(() => {
  presentiController.initialize().then(() => {
    presentiController.on("background", ({ color, transition }) => {
      hueController.updateToColor(color, transition);
    });
  });
});