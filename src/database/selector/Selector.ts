import { EntityType } from "../Entity.js";
import { AnyExpression, ExpressionConstant } from "./Expression.js";
import { QueryOperators } from "./Operator.js";

export type SelectorVarsDefinition = { readonly [name: string]: (value?: any) => ExpressionConstant }

export type SelectorVars<Vars extends SelectorVarsDefinition> = { readonly [K in keyof Vars]: Vars[K] extends (value?: any) => infer T ? T : never };

interface EntitySelectorDefinition<E extends EntityType, Vars extends SelectorVarsDefinition = {}> {
    readonly entityType: E;
    readonly variables?: Vars;
    readonly expression: (q: QueryOperators<E, Vars>) => AnyExpression<E>;
}

export interface EntitySelector<E extends EntityType, Vars extends SelectorVarsDefinition = {}> extends EntitySelectorDefinition<E, Vars> { }

export class EntitySelector<E extends EntityType, Vars extends SelectorVarsDefinition = {}> {
    constructor(definition: EntitySelectorDefinition<E, Vars>) {
        Object.assign(this, definition);
    }
}
