import { assert, Overwrite, Primitive } from "../../utils/index.js";
import { EntityType } from "../Entity.js";
import { State } from "../state/index.js";
import { AnyExpression, BooleanExpression, ComparisonExpression, ExpressionVariable } from "./Expression.js";
import { QueryOperators } from "./Operator.js";

export type SelectorVars = {
    readonly [name: string]: (value?: any) => Primitive;
};

export type SelectorVarValues<Vars extends SelectorVars> = {
    readonly [K in keyof Vars]: Vars[K] extends ((value?: any) => infer T) ? T : never;
};

interface Definition<E extends EntityType, Vars extends SelectorVars> {
    readonly entityType: E;
    readonly variables?: Vars;
    readonly expression: AnyExpression<E, Vars>;
}

type DefinitionArgument<E extends EntityType, Vars extends SelectorVars> = Overwrite<Definition<E, Vars>, {
    readonly expression: (q: QueryOperators<E, Vars>) => AnyExpression<E, Vars>;
}>;

export interface Selector<E extends EntityType, Vars extends SelectorVars = {}> extends Definition<E, Vars> { }

export class Selector<E extends EntityType, Vars extends SelectorVars = {}> {
    constructor(definition: DefinitionArgument<E, Vars>) {
        Object.assign(this, {
            entityType: definition.entityType,
            variables: Object.freeze({ ...definition.variables }),
            expression: definition.expression(QueryOperators as unknown as QueryOperators<E, Vars>),
        });

        checkExpression(this);

        Object.freeze(this);
    }
}

function checkExpression<E extends EntityType>(selector: Selector<E, any>, expression?: AnyExpression<EntityType, any>) {
    expression ??= selector.expression;

    if (expression instanceof ComparisonExpression) {
        const checkState = (state: State<any, any>) => {
            assert(state.entityType == selector.entityType, `${state.entityType} state cannot be used in ${selector.entityType} selector expression`);
        };

        checkState(expression.left);
        if (expression.right instanceof State) {
            checkState(expression.right);
        }
        else if (expression.right instanceof ExpressionVariable) {
            assert(expression.right.name in selector.variables, `unknown selector variable '${expression.right.name}'`);
        }
    }

    if (expression instanceof BooleanExpression) {
        expression.subExpressions.forEach(subExpression => checkExpression(selector, subExpression));
    }
}
