import { EventStorage } from "../../event/index.js";

export interface Cache<T> {
    readonly size: number;

    has(item: T): boolean;
    values(): IterableIterator<T>;

    readonly events: EventStorage<Cache<T>, {
        added(item: T): void;
    }>;
}

export interface PublicCache<T> extends Cache<T> {
    add(item: T): void;
}
