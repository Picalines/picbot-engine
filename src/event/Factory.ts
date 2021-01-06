import { assert } from "../utils";
import { EmitEvent, EventListener, EventStorage, PublicEventStorage } from "./EventStorage";

export function createEventStorage<Emitter, Events>(emitter: Emitter, events: Events): [storage: EventStorage<Emitter, Events>, emit: EmitEvent<Emitter, Events>] {
    const eventNames = Object.keys(events) as (keyof Events)[];

    const listeners = new Map<keyof Events, EventListener<Emitter, any>[]>();
    let onceListeners = new Map<keyof Events, EventListener<Emitter, any>[]>();

    eventNames.forEach(event => {
        listeners.set(event, []);
        onceListeners.set(event, []);
    });

    const assertEventName = (eventName: keyof Events) => {
        assert(eventNames.includes(eventName), `event storage does not contain an event '${eventName}'`);
    }

    const storage: EventStorage<Emitter, Events> = {
        names: eventNames,

        on(name, listener) {
            assertEventName(name);
            listeners.get(name)!.push(listener);
            return {
                dispose: () => this.off(name, listener),
            };
        },

        off(name, listener) {
            assertEventName(name);
            const eventListeners = listeners.get(name)!;
            const index = eventListeners.indexOf(listener);
            if (index < 0) {
                return false;
            }

            eventListeners.splice(index, 1);

            return true;
        },

        once(name, listener) {
            assertEventName(name);
            onceListeners.get(name)!.push(listener);
        },
    };

    const emit: EmitEvent<Emitter, Events> = (name, ...args) => {
        assertEventName(name);
        listeners.get(name)!.forEach(listener => listener.call(emitter, ...args));

        const oncers = onceListeners.get(name)!;
        if (oncers.length > 0) {
            onceListeners.set(name, []);
            oncers.forEach(listener => listener.call(emitter, ...args));
        }
    };

    return [storage, emit];
}

export function createPublicEventStorage<Events>(events: Events): PublicEventStorage<Events> {
    const [storage, emit] = createEventStorage(globalThis as any, events);
    return {
        ...storage,
        emit,
    };
}
