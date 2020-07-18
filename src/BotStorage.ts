/**
 * Абстрактный класс хранилища
 */
export abstract class Storage<T> implements Iterable<T> {
    /**
     * Добавляет значение в хранилище
     * @param value значение, которое нужно добавить в хранилище
     * @returns true, если значение успешно добавлено
     */
    abstract add(value: T): boolean;

    /**
     * Возвращает количество элементов в хранилище
     */
    abstract get size(): number;

    /**
     * Возвращает элементы хранилища в виде массива
     */
    abstract array(): T[];

    public [Symbol.iterator]() {
        return this.array().values();
    }
}

export abstract class BotStorage {
    
}
