import Api, { Light } from "node-hue-api/lib/api/Api";
interface BridgeStruct {
    name: string;
    ipaddress: string;
    manufacturer?: string;
    modelid?: string;
    swversion?: string;
    model?: {
        number: string;
        description: string;
        name: string;
        serial: string;
    };
    version?: {
        major: string;
        minor: string;
    };
    icons?: {
        mimetype: string;
        height: string;
        width: string;
        depth: string;
        url: string;
    }[];
}
/**
 * Wrapper around node-hue-api for issuing hex color changes with a transition
 */
export declare class HueController {
    api: Api;
    lights: Light[];
    rotating: boolean;
    /**
     * Connect to api, do any necessary auth
     */
    initialize(): Promise<void>;
    /**
     * Sets all lights in the group to a given hex color, with a transition in milliseconds
     * @param color hex color
     * @param transition transition in milliseconds
     */
    updateToColor(color: string, transition: number, force?: boolean): Promise<void>;
    /**
     * Loads light data for the group
     */
    private populateLights;
    /**
     * Prompt the user to select a group
     */
    private selectGroup;
    /**
     * Prompt the user to press the link button, and create a user with the authorization
     */
    private createUser;
    get acknowledgedShittyGroup(): boolean | undefined;
    set acknowledgedShittyGroup(acknowledgedShittyGroup: boolean | undefined);
    get gamut(): any;
    get gamuts(): any[];
    get requiresIndividualConversion(): boolean;
    get group(): string | number | null | undefined;
    set group(group: string | number | null | undefined);
    get ip(): string | null;
    set ip(ipAddress: string | null);
    get user(): string | null;
    set user(user: string | null);
    /**
     * Prompt the user to select a bridge
     */
    static selectBridge(): Promise<BridgeStruct | null>;
    /**
     * List all available bridges using the non-uPnP API
     */
    static bridges(): Promise<BridgeStruct[]>;
}
export {};
