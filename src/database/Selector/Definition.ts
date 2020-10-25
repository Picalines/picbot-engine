import { Entity } from "../Entity";
import { AnyExpression } from "./Expression";
import { QueryOperators } from "./Operator";

export interface EntitySelectorDefinition<E extends Entity> {
    /**
     * Тип сущностей, которые ищет селектор
     */
    readonly entityType: E;
    /**
     * Выражение, по которому селектор ищет сущностей
     */
    readonly expression: (q: QueryOperators<E>) => AnyExpression<E>;
}

export interface EntitySelector<E extends Entity> extends EntitySelectorDefinition<E> { }

/**
 * Селектор сущности в базе данных. Используется в
 * методе [[BotDatabase.selectEntities]]
 */
export class EntitySelector<E extends Entity> {
    constructor(definition: EntitySelectorDefinition<E>) {
        Object.assign(this, definition);
    }
}

/**
 * Настройки селектора
 */
export interface EntitySelectorOptions {
    /**
     * Максимальное количество сущностей, которое может найти селектор
     * @default Infinity
     */
    maxCount: number;
    /**
     * Ошибка, которую выбросит селектор, если он ничего не найдёт
     * @default undefined
     */
    throwOnNotFound: Error | undefined;
}
