/**
 * Хранилище префиксов команд
 */
export class PrefixStorage implements Iterable<string> {
    #prefixes = new Set<string>();

    constructor(initialPrefixes?: string[]) {
        if (initialPrefixes) {
            initialPrefixes.forEach(p => this.add(p));
            if (!this.size) {
                throw new Error('prefix storage can not be empty');
            }
        }
    }

    /**
     * Количество префиксов в хранилище
     */
    get size(): number {
        return this.#prefixes.size;
    }

    /**
     * Свойство, возвращающее список префиксов в хранилище.
     * Список доступен только для чтения
     */
    get list(): string[] {
        return [...this.#prefixes];
    }

    /**
     * Ставит список префиксов в хранилище
     * @param prefixes
     */
    set list(prefixes: string[]) {
        prefixes = prefixes.filter(p => p.length && !p.includes(' ')).map(p => p.toLowerCase());
        this.#prefixes = new Set(prefixes);
        if (!this.size) {
            throw new Error('prefix storage can not be empty');
        }
    }

    public [Symbol.iterator](): IterableIterator<string> {
        return this.#prefixes.values();
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

    public toString(): string {
        return `${PrefixStorage.name}(${this.size}) { ${this.list.join(', ')} }`;
    }
}
