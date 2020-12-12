import { Guild, GuildMember } from "discord.js";
import { Entity, EntityType } from "../Entity";
import { DatabaseValueStorage } from "../property";
import { AnyExpression, EntitySelector } from "../selector";
import { CompiledExpression, compileExpression } from "./Expression";

type CompiledExpressionData = { arrow: CompiledExpression, usedKeys: string[] };

export class JsonDatabaseValueStorage extends DatabaseValueStorage<EntityType> {
    /**
     * Map<ключ свойства, Map<id сущности, значение свойства>>
     */
    private readonly propertyMaps = new Map<string, Map<string, any>>();

    /**
     * 'Скомпилированные' выражения селекторов
     */
    private readonly compiledExpressions = new WeakMap<EntitySelector<EntityType>, CompiledExpressionData>();

    storeValue<T>(entity: Entity<EntityType>, key: string, value: T) {
        let propertyMap = this.propertyMaps.get(key);

        if (!propertyMap) {
            propertyMap = new Map();
            this.propertyMaps.set(key, propertyMap);
        }

        propertyMap.set(entity.id, value);
    }

    restoreValue(entity: Entity<EntityType>, key: string) {
        return this.propertyMaps.get(key)?.get(entity.id);
    }

    deleteValue(entity: Entity<EntityType>, key: string) {
        return this.propertyMaps.get(key)?.delete(entity.id) ?? false;
    }

    *selectEntities(entities: IterableIterator<Guild | GuildMember>, selector: EntitySelector<EntityType, any>, expression: AnyExpression<EntityType>, variables: any) {
        let compiledExpression = this.compiledExpressions.get(selector);

        if (compiledExpression === undefined) {
            const usedKeysSet = new Set<string>();
            const arrow = compileExpression(expression, usedKeysSet);
            compiledExpression = { arrow, usedKeys: [...usedKeysSet.values()] };
            this.compiledExpressions.set(selector, compiledExpression);
        }

        const props = [...this.database.cache.properties.values()]
            .filter(p => p.entityType == this.entityType && compiledExpression!.usedKeys.includes(p.key));

        for (const entity of entities) {
            const entityProps: Record<string, any> = {};
            props.map(p => entityProps[p.key] = this.restoreValue(entity, p.key) ?? p.defaultValue);
            if (compiledExpression.arrow(entityProps, variables)) {
                yield entity;
            }
        }
    }

    cleanup() {
        this.propertyMaps.clear();
    }

    cleanupEntity(entity: Guild | GuildMember) {
        for (const propMap of this.propertyMaps.values()) {
            propMap.delete(entity.id);
        }
    }
}
