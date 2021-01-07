import { AnyEntitySelector } from "../selector";
import { CompiledExpression, compileExpression } from "./Expression";
import { Database } from "../Database";
import { StateStorage } from "../state";
import { EntityType } from "../Entity";

export const createJsonStateStorage = (database: Database) => <E extends EntityType>(entityType: E): StateStorage<E> => {
    const entityMap = new Map<string, Record<string, any>>();

    const compiledExpressions = new WeakMap<AnyEntitySelector, CompiledExpression>();

    return {
        store({ id }, { key }, value) {
            let state = entityMap.get(id);

            if (!state) {
                state = {};
                entityMap.set(id, state);
            }

            state[key] = value;
        },

        restore({ id }, { key }) {
            return entityMap.get(id)?.[key];
        },

        delete({ id }, { key }) {
            const state = entityMap.get(id);
            if (state) {
                delete state[key];
            }
        },

        deleteEntity({ id }) {
            entityMap.delete(id);
        },

        clear() {
            entityMap.clear();
        },

        *selectEntities(entities, selector, expression, variables) {
            let compiledExpression = compiledExpressions.get(selector as any);

            if (compiledExpression === undefined) {
                compiledExpression = compileExpression(expression);
                compiledExpressions.set(selector as any, compiledExpression);
            }

            const defaultState = database.defaultEntityState![entityType];

            for (const entity of entities) {
                const entityState = { ...defaultState, ...entityMap.get(entity.id) };
                if (compiledExpression!(entityState, variables)) {
                    yield entity;
                }
            }
        },
    }
}
