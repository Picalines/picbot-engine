import { EventEmitter } from "events";
import { PublicEventStorage } from "./EventStorage";

/**
 * NodeJS.EventEmitter -> EventStorage
 */
export const createNodeEmitterLink = <NE extends EventEmitter, Events>(emitter: NE, events: (keyof Events)[]): PublicEventStorage<Events, NE> => ({
    names: events,

    on(event: keyof Events, listener: Function) {
        emitter.on(event as string, listener as any);
        return {
            dispose: () => void emitter.off(event as string, listener as any),
        }
    },

    off(event: keyof Events, listener: Function) {
        const oldCount = emitter.listenerCount(event as string);
        emitter.off(event as string, listener as any);
        return oldCount > emitter.listenerCount(event as string);
    },

    once(event: keyof Events, listener: Function) {
        emitter.once(event as string, listener as any);
    },

    emit(event: keyof Events, ...args: any[]) {
        emitter.emit(event as string, ...args);
    },
});
