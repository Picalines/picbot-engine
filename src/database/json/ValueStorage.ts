import { AnyEntity, EntityType } from "../Entity";
import { DatabaseValueStorage } from "../property";
import { AnyEntitySelector, AnyExpression, EntitySelector } from "../selector";
import { CompiledExpression, compileExpression } from "./Expression";

type CompiledExpressionData = { arrow: CompiledExpression, usedKeys: string[] };

export class JsonDatabaseValueStorage extends DatabaseValueStorage<EntityType> {
    /**
     * Map<property key, Map<entity id, property value>>
     */
    private readonly propertyMaps = new Map<string, Map<string, any>>();

    private readonly compiledExpressions = new WeakMap<EntitySelector<EntityType>, CompiledExpressionData>();

    storeValue(entity: AnyEntity, key: string, value: any) {
        let propertyMap = this.propertyMaps.get(key);

        if (!propertyMap) {
            propertyMap = new Map();
            this.propertyMaps.set(key, propertyMap);
        }

        propertyMap.set(entity.id, value);
    }

    restoreValue(entity: AnyEntity, key: string) {
        return this.propertyMaps.get(key)?.get(entity.id);
    }

    deleteValue(entity: AnyEntity, key: string) {
        return this.propertyMaps.get(key)?.delete(entity.id) ?? false;
    }

    *selectEntities(entities: IterableIterator<AnyEntity>, selector: AnyEntitySelector, expression: AnyExpression<EntityType>, variables: any) {
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

    cleanupEntity(entity: AnyEntity) {
        for (const propMap of this.propertyMaps.values()) {
            propMap.delete(entity.id);
        }
    }
}
