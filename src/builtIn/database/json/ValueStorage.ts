import { Entity as Entity, WidenEntity } from "../../../database/Property/Definition";
import { DatabaseValueStorage } from "../../../database/Property/Storage";
import { Guild, GuildMember } from "discord.js";

export class JsonDatabaseValueStorage extends DatabaseValueStorage<Entity> {
    #propertyMaps = new Map<string, Map<string, any>>();

    storeValue<T>(entity: WidenEntity<Entity>, key: string, value: T): void {
        let propertyMap = this.#propertyMaps.get(key);

        if (!propertyMap) {
            propertyMap = new Map();
            this.#propertyMaps.set(key, propertyMap);
        }

        propertyMap.set(entity.id, value);
    }

    restoreValue<T>(entity: WidenEntity<Entity>, key: string): T | undefined {
        return this.#propertyMaps.get(key)?.get(entity.id);
    }

    deleteValue(entity: WidenEntity<Entity>, key: string): boolean {
        return this.#propertyMaps.get(key)?.delete(entity.id) ?? false;
    }

    cleanup(): void {
        this.#propertyMaps.clear();
    }

    cleanupEntity(entity: Guild | GuildMember): void {
        for (const propMap of this.#propertyMaps.values()) {
            propMap.delete(entity.id);
        }
    }
}
