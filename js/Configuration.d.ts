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
    };
}
export declare const CONFIG_PATH: string;
export declare const CONFIG: ConfigurationStruct;
export declare const saveConfig: () => Promise<void>;
