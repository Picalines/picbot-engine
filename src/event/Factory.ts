import { EmitEvent, EventListener, EventStorage, PublicEventStorage } from "./EventStorage";

/**
 * Создаёт хранилище событий
 * @param events объявление событий
 */
export function createEventStorage<Events>(events: Events): [storage: EventStorage<Events>, emit: EmitEvent<Events>] {
    const eventNames = Object.keys(events) as (keyof Events)[];

    const listeners = new Map<keyof Events, EventListener<any>[]>();
    let onceListeners = new Map<keyof Events, EventListener<any>[]>();

    eventNames.forEach(event => {
        listeners.set(event, []);
        onceListeners.set(event, []);
    });

    const assertEventName = (eventName: keyof Events) => {
        if (!eventNames.includes(eventName)) {
            throw new Error(`event storage does not contain an event '${eventName}'`);
        }
    }

    const storage: EventStorage<Events> = {
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

    const emit: EmitEvent<Events> = (name, ...args) => {
        assertEventName(name);
        listeners.get(name)!.forEach(listener => listener(...args));

        const oncers = onceListeners.get(name)!;
        if (oncers.length > 0) {
            onceListeners.set(name, []);
            oncers.forEach(listener => listener(...args));
        }
    };

    return [storage, emit];
}

/**
 * Создаёт публичное хранилище событий
 * @param events объявление событий
 */
export function createPublicEventStorage<Events>(events: Events): PublicEventStorage<Events> {
    const [storage, emit] = createEventStorage(events);
    return {
        ...storage,
        emit,
    };
}
