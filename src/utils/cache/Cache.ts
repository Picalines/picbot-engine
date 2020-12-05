import { EventStorage } from "../../event";

/**
 * Интерфейс кэша
 */
export interface Cache<T> {
    /**
     * Кол-во закэшированных значений
     */
    readonly size: number;

    /**
     * @returns true, если значение есть в кэше
     * @param item
     */
    has(item: T): boolean;

    /**
     * @returns итератор закэшированных значений
     */
    values(): IterableIterator<T>;

    /**
     * События объекта кэша
     */
    readonly events: EventStorage<Cache<T>, {
        added(item: T): void;
    }>;
}

/**
 * Интерфейс кэша с публичной функцией записи
 */
export interface PublicCache<T> extends Cache<T> {
    /**
     * Добавляет значение в кэш
     * @param item
     */
    add(item: T): void;
}

/**
 * @returns функция записи у кэша
 */
export type CacheAddOf<T extends Cache<any>> = PublicCache<T extends Cache<infer U> ? U : never>['add'];
