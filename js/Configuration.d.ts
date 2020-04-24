export interface ConfigurationStruct {
    hue: {
        user: string | null;
        ip: string | null;
        group: string | number | undefined | null;
        acknowledgedShittyGroup: boolean | undefined;
    };
    presenti: {
        endpoint: string | null;
        scope: string | null;
        neutralColor: string | null;
    };
    web: {
        passwordHash: string | null;
        cookieKey: string | null;
        enabled: boolean | null;
        port: number | null;
    };
}
export declare const CONFIG_PATH: string;
export declare const CONFIG: ConfigurationStruct;
export declare const saveConfig: () => Promise<void>;
export declare const ui: import("inquirer/lib/ui/bottom-bar");
