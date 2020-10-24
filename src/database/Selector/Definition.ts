import { Entity } from "../Entity";
import { AnyExpression } from "./Expression";
import { QueryOperators } from "./Operator";

export interface EntitySelectorDefinition<E extends Entity> {
    readonly key: string;
    readonly entityType: E;
    readonly expression: (q: QueryOperators<E>) => AnyExpression<E>;
}

export interface EntitySelector<E extends Entity> extends EntitySelectorDefinition<E> { }

export class EntitySelector<E extends Entity> {
    constructor(definition: EntitySelectorDefinition<E>) {
        Object.assign(this, definition);
    }
}

export interface EntitySelectorOptions {
    maxCount: number;
    throwOnNotFound: Error;
}
