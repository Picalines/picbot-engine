import { Entity, WidenEntity } from "../../../database/Entity";
import { DatabaseValueStorage } from "../../../database/Property/ValueStorage";
import { Guild, GuildMember } from "discord.js";
import { AnyExpression } from "../../../database/Selector/Expression";
import { PromiseOrSync } from "../../../utils";
import { CompiledExpression, compileExpression } from "./Expression";

export class JsonDatabaseValueStorage extends DatabaseValueStorage<Entity> {
    #propertyMaps = new Map<string, Map<string, any>>();

    #compiledExpressions = new WeakMap<AnyExpression<Entity>, CompiledExpression>();

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

    selectEntities(entities: IterableIterator<WidenEntity<Entity>>, expression: AnyExpression<Entity>): PromiseOrSync<WidenEntity<Entity>[]> {
        const selected: WidenEntity<Entity>[] = [];

        let compiledExpression = this.#compiledExpressions.get(expression);
        if (compiledExpression === undefined) {
            compiledExpression = compileExpression(expression);
            this.#compiledExpressions.set(expression, compiledExpression);
        }

        const propKeys = this.database.definedProperties.list(this.entityType).map(p => p.key);

        for (const entity of entities) {
            const entityProps: Record<string, any> = {};
            propKeys.map(key => entityProps[key] = this.restoreValue(entity, key));
            if (compiledExpression(entityProps)) {
                selected.push(entity);
            }
        }

        return selected;
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
