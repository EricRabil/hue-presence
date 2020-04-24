declare namespace Express {
  export interface Request {
    controllers: {
      web: import("../ts/Web").WebController;
      hue: import("../ts/Hue").HueController;
      presenti: import("../ts/Presenti").PresentiController;
    }
  }
}