import { Guild, GuildMember } from "discord.js";
import { Entity, WidenEntity } from "../../../database/Entity";
import { DatabaseValueStorage } from "../../../database/Property/ValueStorage";
import { AnyExpression } from "../../../database/Selector/Expression";
import { CompiledExpression, compileExpression } from "./Expression";

type CompiledExpressionData = { arrow: CompiledExpression, usedKeys: string[] };

export class JsonDatabaseValueStorage extends DatabaseValueStorage<Entity> {
    #propertyMaps = new Map<string, Map<string, any>>();
    #compiledExpressions = new WeakMap<AnyExpression<Entity>, CompiledExpressionData>();

    storeValue<T>(entity: WidenEntity<Entity>, key: string, value: T) {
        let propertyMap = this.#propertyMaps.get(key);

        if (!propertyMap) {
            propertyMap = new Map();
            this.#propertyMaps.set(key, propertyMap);
        }

        propertyMap.set(entity.id, value);
    }

    restoreValue(entity: WidenEntity<Entity>, key: string) {
        return this.#propertyMaps.get(key)?.get(entity.id);
    }

    deleteValue(entity: WidenEntity<Entity>, key: string) {
        return this.#propertyMaps.get(key)?.delete(entity.id) ?? false;
    }

    selectEntities(entities: IterableIterator<WidenEntity<Entity>>, expression: AnyExpression<Entity>, maxCount: number): WidenEntity<Entity>[] {
        let compiledExpression = this.#compiledExpressions.get(expression);
        if (compiledExpression === undefined) {
            const usedKeysSet = new Set<string>();
            const arrow = compileExpression(expression, usedKeysSet);
            compiledExpression = {
                arrow,
                usedKeys: [...usedKeysSet.values()],
            };
            this.#compiledExpressions.set(expression, compiledExpression);
        }

        const props = this.database.definedProperties.list(this.entityType)
            .filter(p => compiledExpression!.usedKeys.includes(p.key));

        const selected: WidenEntity<Entity>[] = [];

        for (const entity of entities) {
            const entityProps: Record<string, any> = {};
            props.map(p => entityProps[p.key] = this.restoreValue(entity, p.key) ?? p.defaultValue);
            if (compiledExpression.arrow(entityProps)) {
                selected.push(entity);
                if (selected.length >= maxCount) {
                    return selected;
                }
            }
        }

        return selected;
    }

    cleanup() {
        this.#propertyMaps.clear();
    }

    cleanupEntity(entity: Guild | GuildMember) {
        for (const propMap of this.#propertyMaps.values()) {
            propMap.delete(entity.id);
        }
    }
}
