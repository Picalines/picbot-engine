import { Property } from "../..";
import { Entity } from "../Entity";
import { BinaryCompareOperator, BinaryLogicOperator, UnaryOperator } from "./Operator";

export type Constant =
    | number
    | string
    | boolean

export class UnaryExpression<E extends Entity, O extends UnaryOperator> {
    constructor(
        public readonly operator: O,
        public readonly right: UnaryExpression<E, UnaryOperator> | BinaryExpression<E>,
    ) { }
}

export class ComparisonExpression<E extends Entity, O extends BinaryCompareOperator, T extends Constant> {
    constructor(
        public readonly operator: O,
        public readonly left: Property<E, T>,
        public readonly right: Property<E, T> | T,
    ) { }
}

export class BooleanExpression<E extends Entity, O extends BinaryLogicOperator> {
    constructor(
        public readonly operator: O,
        public readonly left: AnyExpression<E>,
        public readonly right: AnyExpression<E>,
    ) { }
}

export type BinaryExpression<E extends Entity> = ComparisonExpression<E, BinaryCompareOperator, Constant> | BooleanExpression<E, BinaryLogicOperator>;

export type AnyExpression<E extends Entity> = UnaryExpression<E, UnaryOperator> | BinaryExpression<E>;
