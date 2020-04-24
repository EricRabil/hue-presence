import express from "express";
import { HueController } from "./Hue";
import { PresentiController } from "./Presenti";
export declare class WebController {
    app: express.Express;
    initialize(hueController: HueController, presentiController: PresentiController): Promise<void>;
    private runConfiguration;
    get enabled(): boolean | null;
    set enabled(enabled: boolean | null);
    get cookieKey(): string | null;
    set cookieKey(key: string | null);
    get hash(): string | null;
    set hash(hash: string | null);
    get port(): number | null;
    set port(port: number | null);
}
