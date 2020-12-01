import { EntityType } from "../Entity";
import { Property } from "../property/Property";
import { ComparisonExpression, BooleanExpression, UnaryExpression, AnyExpression, Constant } from "./Expression";

/**
 * Унарный оператор
 */
export type UnaryOperator = 'not'

/**
 * Бинарный оператор булевой логики
 */
export type BinaryLogicOperator =
    | 'and'
    | 'or'

/**
 * Бинарный оператор сравнения
 */
export type BinaryCompareOperator =
    | 'gt'
    | 'gte'
    | 'lt'
    | 'lte'
    | 'eq'

/**
 * Бинарный оператор
 */
export type BinaryOperator =
    | BinaryCompareOperator
    | BinaryLogicOperator

/**
 * Операторы выражения для поиска по базе данных
 */
export interface QueryOperators<E extends EntityType> {
    /**
     * @example xpProperty > 0
     */
    gt(l: Property<E, number>, r: Property<E, number> | number): ComparisonExpression<E, 'gt', number>;

    /**
     * @example xpProperty >= 0
     */
    gte(l: Property<E, number>, r: Property<E, number> | number): ComparisonExpression<E, 'gte', number>;

    /**
     * @example xpProperty < 0
     */
    lt(l: Property<E, number>, r: Property<E, number> | number): ComparisonExpression<E, 'lt', number>;

    /**
     * @example xpProperty <= 0
     */
    lte(l: Property<E, number>, r: Property<E, number> | number): ComparisonExpression<E, 'lte', number>;

    /**
     * @example xpProperty == 0
     */
    eq<T extends Constant>(l: Property<E, T>, r: Property<E, T> | T): ComparisonExpression<E, 'eq', T>;

    /**
     * @example (...) && (...)
     */
    and(l: AnyExpression<E>, r: AnyExpression<E>): BooleanExpression<E, 'and'>;
    /**
     * @example (...) || (...)
     */
    or(l: AnyExpression<E>, r: AnyExpression<E>): BooleanExpression<E, 'or'>;

    /**
     * @example !(...)
     */
    not(r: AnyExpression<E>): UnaryExpression<E, 'not'>;
}

export const OperatorExpressions: QueryOperators<EntityType> = {
    gt: (l, r) => new ComparisonExpression('gt', l, r),
    gte: (l, r) => new ComparisonExpression('gte', l, r),
    lt: (l, r) => new ComparisonExpression('lt', l, r),
    lte: (l, r) => new ComparisonExpression('lte', l, r),

    eq: (l, r) => new ComparisonExpression('eq', l, r),

    and: (l, r) => new BooleanExpression('and', l, r),
    or: (l, r) => new BooleanExpression('or', l, r),

    not: r => new UnaryExpression('not', r),
};
