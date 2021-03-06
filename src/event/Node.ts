import { EventEmitter } from "events";
import { Event } from "./Event.js";

export function nodeEmitterEvents(emitter: EventEmitter, eventNames: readonly string[]) {
    const events: Record<string, Event<any>> = {};

    eventNames.forEach(event => events[event] = <Event<any>>{
        on: listener => void emitter.on(event, listener),
        off: listener => void emitter.off(event, listener),
        once: listener => void emitter.once(event, listener),
        emit: (...args) => void emitter.emit(event, ...args)
    });

    return Object.freeze(events);
}
