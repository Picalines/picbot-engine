import { Entity } from "../Entity";
import { Property } from "../Property/Definition";
import { ComparisonExpression, BooleanExpression, UnaryExpression, AnyExpression, Constant } from "./Expression";

export type UnaryOperator = 'not'

export type BinaryLogicOperator =
    | 'and'
    | 'or'

export type BinaryCompareOperator =
    | 'gt'
    | 'gte'
    | 'lt'
    | 'lte'
    | 'eq'

export type BinaryOperator =
    | BinaryCompareOperator
    | BinaryLogicOperator

export interface QueryOperators<E extends Entity> {
    gt(l: Property<E, number>, r: Property<E, number> | number): ComparisonExpression<E, 'gt', number>;

    gte(l: Property<E, number>, r: Property<E, number> | number): ComparisonExpression<E, 'gte', number>;

    lt(l: Property<E, number>, r: Property<E, number> | number): ComparisonExpression<E, 'lt', number>;

    lte(l: Property<E, number>, r: Property<E, number> | number): ComparisonExpression<E, 'lte', number>;

    eq<T extends Constant>(l: Property<E, T>, r: Property<E, T> | T): ComparisonExpression<E, 'eq', T>;

    and(l: AnyExpression<E>, r: AnyExpression<E>): BooleanExpression<E, 'and'>;
    or(l: AnyExpression<E>, r: AnyExpression<E>): BooleanExpression<E, 'or'>;

    not(r: AnyExpression<E>): UnaryExpression<E, 'not'>;
}

export const OperatorExpressions: QueryOperators<Entity> = {
    'gt': (l, r) => new ComparisonExpression('gt', l, r),
    'gte': (l, r) => new ComparisonExpression('gte', l, r),
    'lt': (l, r) => new ComparisonExpression('lt', l, r),
    'lte': (l, r) => new ComparisonExpression('lte', l, r),

    'eq': (l, r) => new ComparisonExpression('eq', l, r),

    'and': (l, r) => new BooleanExpression('and', l, r),
    'or': (l, r) => new BooleanExpression('or', l, r),

    'not': r => new UnaryExpression('not', r),
};
