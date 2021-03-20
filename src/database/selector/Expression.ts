import { State } from "../state/index.js";
import { EntityType } from "../Entity.js";
import { SelectorVars, SelectorVarValues } from "./Selector.js";
import { assert, NonEmpty } from "../../utils/index.js";

export class ExpressionVariable<Vars extends SelectorVars, T> {
    constructor(readonly name: { [K in keyof Vars]: SelectorVarValues<Vars>[K] extends T ? K : never }[keyof Vars]) { }
}

export type ComparsionOperator<T>
    = 'eq' | 'ne' | (T extends number ? | 'gt' | 'gte' | 'lt' | 'lte' : never);

export class ComparisonExpression<E extends EntityType, O extends ComparsionOperator<T>, T, Vars extends SelectorVars> {
    constructor(
        readonly operator: O,
        readonly left: State<E, T>,
        readonly right: State<E, T> | T | ExpressionVariable<Vars, T>,
    ) {
        Object.freeze(this);
    }
}

export type BooleanOperator = 'not' | 'and' | 'or';

export class BooleanExpression<E extends EntityType, O extends BooleanOperator, Vars extends SelectorVars> {
    readonly subExpressions: readonly AnyExpression<E, Vars>[];

    constructor(
        readonly operator: O,
        ...expressions: O extends 'not' ? [AnyExpression<E, Vars>] : Readonly<NonEmpty<AnyExpression<E, Vars>[]>>
    ) {
        this.subExpressions = [...expressions];

        assert(this.subExpressions.length, 'empty subexpressions array');
        if (this.operator == 'not') {
            assert(this.subExpressions.length == 1, "'not' operator cannot have more than one subexpression");
        }

        Object.freeze(this);
        Object.freeze(this.subExpressions);
    }
}

export type AnyExpression<E extends EntityType, Vars extends SelectorVars> =
    | ComparisonExpression<E, ComparsionOperator<any>, any, Vars>
    | BooleanExpression<E, BooleanOperator, Vars>;
