import { PromiseOrSync, PromiseVoid, WidenLiteral } from "../utils";

export type AllowedPropertyTypes = string | number | any[];

export abstract class DatabasePropertyMap {
    /**
     * @returns список ключей свойств
     */
    public abstract get keys(): IterableIterator<string>;

    /**
     * @returns true, если объект не содержит свойств
     */
    public get isEmpty(): boolean {
        return this.keys.next().done ?? false;
    }

    /**
     * @returns значение свойства участника сервера или undefined
     * @param key ключ свойства
     */
    public abstract getOrUndefined(key: string): PromiseOrSync<WidenLiteral<AllowedPropertyTypes | undefined>>;

    /**
     * @returns значение свойства участника сервера или стандартное значение
     * @param key ключ свойства
     * @param _default стандартное значение
     */
    async get<T extends AllowedPropertyTypes>(key: string, _default: T): Promise<WidenLiteral<T>> {
        const property = await this.getOrUndefined(key);
        return (property ?? _default) as WidenLiteral<T>;
    }

    /**
     * Ставит значение свойству по ключу
     * @param key ключ свойства
     * @param value значение свойства
     */
    public abstract set(key: string, value: Exclude<AllowedPropertyTypes, undefined>): PromiseVoid;

    /**
     * Удаляет совйство по ключу
     * @param key ключ значения
     * @returns true, если значение успешно удалено
     */
    public abstract delete(key: string): PromiseOrSync<boolean>;

    /**
     * @returns true, если содержит свойство с указанным именем
     * @param key ключ значения
     */
    public abstract has(key: string): PromiseOrSync<boolean>;

    /**
     * Добавляет значения в свойство-список. Если указанного свойства нет, создаёт его.
     * @param key ключ значения списка
     */
    async pushToArray(key: string, ...values: any[]): Promise<void> {
        if (!this.has(key)) {
            this.set(key, values);
        }
        else {
            const arr = await this.get<any[]>(key, []);
            if (!(arr instanceof Array)) {
                throw new TypeError(`${key} is not an array`);
            }
            await this.set(key, [...arr, ...values]);
        }
    }

    /**
     * @returns объект со свойствами
     */
    async object(): Promise<Record<string, any>> {
        const obj = {} as Record<string, any>;

        for (const key of this.keys) {
            const property = await this.getOrUndefined(key);
            if (property) {
                obj[key] = property;
            }
        }

        return obj;
    }

    /**
     * @returns entries свойств
     */
    async entries(): Promise<[string, AllowedPropertyTypes][]> {
        return Object.entries(await this.object());
    }

    /**
     * Устанавливает свойства через объект entries
     * @param properties свойства
     */
    async setEntries(properties: [string, AllowedPropertyTypes][]): Promise<void> {
        await Promise.all(properties.map(([key, value]) => this.set(key, value)));
    }

    /**
     * Устанавливает свойства через объект
     * @param properties свойства
     */
    setObject(properties: Record<string, AllowedPropertyTypes>) {
        return this.setEntries(Object.entries(properties));
    }
}
