import { Overwrite } from "../../utils/index.js";
import { EntityType } from "../Entity.js";
import { AnyExpression, ExpressionConstant } from "./Expression.js";
import { OperatorExpressions, QueryOperators } from "./Operator.js";

export type SelectorVars = {
    readonly [name: string]: (value?: any) => ExpressionConstant;
}

export type SelectorVarValues<Vars extends SelectorVars> = {
    readonly [K in keyof Vars]: Vars[K] extends ((value?: any) => infer T) ? T : never;
};

interface Definition<E extends EntityType, Vars extends SelectorVars> {
    readonly entityType: E;
    readonly variables?: Vars;
    readonly expression: AnyExpression<E>;
}

type DefinitionArgument<E extends EntityType, Vars extends SelectorVars> = Overwrite<Definition<E, Vars>, {
    readonly expression: (q: QueryOperators<E, Vars>) => AnyExpression<E>;
}>;

export interface Selector<E extends EntityType, Vars extends SelectorVars = {}> extends Definition<E, Vars> { }

export class Selector<E extends EntityType, Vars extends SelectorVars = {}> {
    constructor(definition: DefinitionArgument<E, Vars>) {
        Object.assign(this, {
            entityType: definition.entityType,
            variables: Object.freeze({ ...definition.variables }),
            expression: definition.expression(OperatorExpressions as unknown as QueryOperators<E, Vars>),
        });
        Object.freeze(this);
    }
}
