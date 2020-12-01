import { EntityType } from "../Entity";
import { AnyExpression } from "./Expression";
import { QueryOperators } from "./Operator";

interface EntitySelectorDefinition<E extends EntityType> {
    /**
     * Тип сущностей, которые ищет селектор
     */
    readonly entityType: E;

    /**
     * Выражение, по которому селектор ищет сущностей
     */
    readonly expression: (q: QueryOperators<E>) => AnyExpression<E>;
}

export interface EntitySelector<E extends EntityType> extends EntitySelectorDefinition<E> { }

/**
 * Селектор сущности в базе данных. Используется в
 * методе [[BotDatabase.selectEntities]]
 */
export class EntitySelector<E extends EntityType> {
    /**
     * @param definition объявление селектора
     */
    constructor(definition: EntitySelectorDefinition<E>) {
        Object.assign(this, definition);

        if (this.entityType != 'guild' && this.entityType != 'member') {
            throw new Error(`invalid entity selector type '${this.entityType}'`);
        }
    }
}
