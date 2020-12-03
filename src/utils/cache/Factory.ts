import { createEventStorage } from "../../event";
import { Cache, PublicCache } from "./Cache";

export function createCache<T>(): [chache: Cache<T>, add: PublicCache<T>['add']] {
    const items = new Set<T>();

    const cache: Cache<T> = {
        get size() {
            return items.size;
        },

        has(item: T) {
            return items.has(item);
        },

        values() {
            return items.values();
        },

        events: undefined as any,
    };

    const [events, emit] = createEventStorage(cache, {
        added(item: T) { },
    });

    Object.assign(cache, { events });

    const add: PublicCache<T>['add'] = (item: T) => {
        const oldSize = items.size;
        items.add(item);
        if (oldSize < items.size) {
            emit('added', item);
        }
    };

    return [cache, add];
}

export function createPublicCache<T>(): PublicCache<T> {
    const [cache, add] = createCache<T>();
    return {
        ...cache,
        add,
    };
}
