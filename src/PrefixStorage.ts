import { ReadOnlyNonEmptyArray } from "./utils";

/**
 * Хранилище префиксов команд
 */
export class PrefixStorage implements Iterable<string> {
    #prefixes: Set<string>;

    /**
     * @param initialPrefixes изначальные префиксы в хранилище
     */
    constructor(initialPrefixes: ReadOnlyNonEmptyArray<string> | PrefixStorage) {
        this.#prefixes = new Set();
        if (initialPrefixes instanceof PrefixStorage) {
            initialPrefixes = initialPrefixes.list;
        }
        initialPrefixes.forEach(prefix => this.add(prefix));
    }

    /**
     * Свойство, возвращающее список префиксов в хранилище.
     * Список доступен только для чтения
     */
    get list(): ReadOnlyNonEmptyArray<string> {
        return [...this.#prefixes] as any;
    }

    public [Symbol.iterator](): IterableIterator<string> {
        return this.#prefixes.values();
    }

    /**
     * Количество префиксов в хранилище
     */
    get size(): number {
        return this.#prefixes.size;
    }

    /**
     * Добавляет префикс в хранилище
     * @param prefix новый префикс
     * @returns true, если этого префикса раньше не было в хранилище
     */
    add(prefix: string): boolean {
        prefix = prefix.toLowerCase();
        if (!prefix || prefix.includes(' ')) {
            throw new Error(`invalid prefix '${prefix}'`);
        }
        const was = this.#prefixes.has(prefix);
        this.#prefixes.add(prefix);
        return !was;
    }

    /**
     * Удаляет префикс из хранилища (если он не единственный)
     * @param prefix префикс, который нужно удалить
     * @returns true, если префикс был удалён
     */
    remove(prefix: string): boolean {
        return this.size > 1 ? this.#prefixes.delete(prefix.toLowerCase()) : false;
    }

    /**
     * @param prefix префикс для проверки
     * @returns true, если префикс есть в хранилище
     */
    has(prefix: string): boolean {
        return this.#prefixes.has(prefix.toLowerCase());
    }

    /**
     * Устанавливает единственный префикс в хранилище
     * @param prefix единственный префикс хранилища
     */
    set(prefix: string) {
        this.#prefixes.clear();
        this.#prefixes.add(prefix.toLowerCase());
    }

    public toString(): string {
        return `${PrefixStorage.name}(${this.size}) { ${this.list.join(', ')} }`;
    }
}
