import { GuildMember } from "discord.js";
import { WidenLiteral } from "../utils";
import { GuildData } from "./Guild";

export class GuildMemberData {
    #map: Map<string, any> | undefined = undefined;

    constructor(
        public readonly guildData: GuildData,
        public readonly member: GuildMember,
    ) { }

    get map(): ReadonlyMap<string, any> | undefined {
        return this.#map;
    }

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

    getProperty<T>(key: string, _default: T): WidenLiteral<T> {
        return this.#map?.get(key) ?? _default;
    }

    setProperty<T>(key: string, value: T): this {
        if (key) {
            if (value === undefined) {
                this.deleteProperty(key);
            }
            else {
                if (!this.#map) this.#map = new Map();
                this.#map.set(key, value);
            }
        }
        return this;
    }

    deleteProperty(key: string): this {
        if (this.#map && this.#map.delete(key) && !this.#map.size) {
            this.#map = undefined;
        }
        return this;
    }
}