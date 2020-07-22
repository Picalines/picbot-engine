import { GuildMember } from "discord.js";
import { WidenLiteral } from "../utils";
import { GuildData } from "./Guild";

export class GuildMemberData {
    #map: Map<string, any> | undefined = undefined;

    constructor(
        /**
         * Ссылка на данные сервера
         */
        public readonly guildData: GuildData,
        /**
         * Участник сервера
         */
        public readonly member: GuildMember,
    ) { }

    /**
     * @returns Map со всеми свойствами
     */
    get map(): ReadonlyMap<string, any> | undefined {
        return this.#map;
    }

    /**
     * Ставит свойства участнику сервера через сеттер
     */
    set map(value: ReadonlyMap<string, any> | undefined) {
        if (!(value && value.size)) {
            this.#map = undefined;
            return;
        }
        this.#map = new Map(value);
        for (const key of this.#map.keys()) {
            if (!key) this.#map.delete(key);
        }
        if (!this.#map.size) {
            this.#map = undefined;
        }
    }

    /**
     * Возвращает значение свойства участника сервера
     * @param key ключ свойства
     * @param _default стандартное значение
     */
    getProperty<T>(key: string, _default: T): WidenLiteral<T> {
        return this.#map?.get(key) ?? _default;
    }

    /**
     * Ставит значение свойству по ключу. Если значение равно `undefined`, значение удаляется
     * @param key ключ свойства
     * @param value значение свойства
     */
    setProperty<T>(key: string, value: T): this {
        if (key) {
            if (value === undefined) {
                return this.deleteProperty(key);
            }
            if (!this.#map) this.#map = new Map();
            this.#map.set(key, value);
        }
        return this;
    }

    /**
     * Удаляет совйство по ключу
     * @param key ключ значения
     */
    deleteProperty(key: string): this {
        if (this.#map && this.#map.delete(key) && !this.#map.size) {
            this.#map = undefined;
        }
        return this;
    }
}