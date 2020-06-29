/**
 * Хранилище префиксов команд
 */
export class PrefixStorage {
    #prefixes: Set<string>;

    /**
     * @param initialPrefixes изначальные префиксы в хранилище
     */
    constructor(initialPrefixes: ReadonlyArray<string> | PrefixStorage = []) {
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
    get list(): ReadonlyArray<string> {
        return [...this.#prefixes];
    }

    /**
     * Количество префиксов в хранилище
     */
    get length(): number {
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
     * Удаляет префикс из хранилища
     * @param prefix префикс, который нужно удалить
     * @returns true, если префикс был удалён
     */
    remove(prefix: string): boolean {
        return this.#prefixes.delete(prefix.toLowerCase());
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
}
