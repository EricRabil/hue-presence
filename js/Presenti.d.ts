/// <reference types="node" />
import { PresenceStream } from "remote-presence-connector";
import { EventEmitter } from "events";
export declare interface PresentiController {
    on(event: "background", fn: (color: {
        color: string;
        transition: number;
    }) => any): this;
    on(event: string | Symbol, fn: (...args: any[]) => any): this;
    emit(event: "background", data: (color: {
        color: string;
        transition: number;
    }) => any): boolean;
    emit(event: string | Symbol, ...args: any[]): boolean;
}
/**
 * Wrapper around PresenceStream for listening to gradient state changes
 */
export declare class PresentiController extends EventEmitter {
    stream: PresenceStream;
    /**
     * Initialize the controller
     */
    initialize(): Promise<void>;
    get scope(): string | null;
    set scope(scope: string | null);
    get endpoint(): string | null;
    set endpoint(endpoint: string | null);
}
