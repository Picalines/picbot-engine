import { EmptyObject } from "../../utils";
import { EntityType } from "../Entity";
import { AnyExpression, Constant } from "./Expression";
import { QueryOperators } from "./Operator";

export type SelectorVars = { readonly [name: string]: (value?: any) => Constant }

export type SelectorVarValues<Vars extends SelectorVars> = { readonly [K in keyof Vars]: Vars[K] extends (value?: any) => infer T ? T : never };

interface EntitySelectorDefinition<E extends EntityType, Vars extends SelectorVars = EmptyObject> {
    /**
     * Тип сущностей, которые ищет селектор
     */
    readonly entityType: E;

    /**
     * Типы переменных, которые может примен
     */
    readonly variables?: Vars;

    /**
     * Выражение, по которому селектор ищет сущностей
     */
    readonly expression: (q: QueryOperators<E, Vars>) => AnyExpression<E>;
}

export interface EntitySelector<E extends EntityType, Vars extends SelectorVars = EmptyObject> extends EntitySelectorDefinition<E, Vars> { }

/**
 * Селектор сущности в базе данных. Используется в
 * методе [[BotDatabase.selectEntities]]
 */
export class EntitySelector<E extends EntityType, Vars extends SelectorVars = EmptyObject> {
    /**
     * @param definition объявление селектора
     */
    constructor(definition: EntitySelectorDefinition<E, Vars>) {
        Object.assign(this, definition);
    }
}

export type AnyEntitySelector = EntitySelector<any, any>;
