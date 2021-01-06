import { Property } from "../property";
import { EntityType } from "../Entity";
import { BinaryCompareOperator, BinaryLogicOperator, UnaryOperator } from "./Operator";
import { SelectorVarsDefinition } from "./Selector";

export type ExpressionConstant =
    | number
    | string
    | boolean

export class ExpressionVariable<Vars extends SelectorVarsDefinition> {
    constructor(readonly name: keyof Vars) { }
}

export class UnaryExpression<E extends EntityType, O extends UnaryOperator, Vars extends SelectorVarsDefinition> {
    constructor(
        readonly operator: O,
        readonly right: UnaryExpression<E, UnaryOperator, Vars> | BinaryExpression<E, Vars>,
    ) { }
}

export class ComparisonExpression<E extends EntityType, O extends BinaryCompareOperator, T extends ExpressionConstant, Vars extends SelectorVarsDefinition> {
    constructor(
        readonly operator: O,
        readonly left: Property<E, T>,
        readonly right: Property<E, T> | T | ExpressionVariable<Vars>,
    ) { }
}

export class BooleanExpression<E extends EntityType, O extends BinaryLogicOperator> {
    constructor(
        readonly operator: O,
        readonly left: AnyExpression<E>,
        readonly right: AnyExpression<E>,
    ) { }
}

export type BinaryExpression<E extends EntityType, Vars extends SelectorVarsDefinition> =
    | ComparisonExpression<E, BinaryCompareOperator, any, Vars>
    | BooleanExpression<E, BinaryLogicOperator>;

export type AnyExpression<E extends EntityType> =
    | UnaryExpression<E, UnaryOperator, any>
    | BinaryExpression<E, any>;
