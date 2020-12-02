import { EntityType } from "../Entity";
import { Property } from "../property/Property";
import { ComparisonExpression, BooleanExpression, UnaryExpression, AnyExpression, Constant, ExpressionVariable } from "./Expression";
import { SelectorVars } from "./Selector";

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

type NumberExpression<E extends EntityType, O extends BinaryCompareOperator, Vars extends SelectorVars> = ComparisonExpression<E, O, number, Vars>;

/**
 * Операторы выражения для поиска по базе данных
 */
export interface QueryOperators<E extends EntityType, Vars extends SelectorVars> {
    /**
     * @example xpProperty > 0
     */
    gt(l: NumberExpression<E, 'gt', Vars>['left'], r: NumberExpression<E, 'gt', Vars>['right']): NumberExpression<E, 'gt', Vars>;

    /**
     * @example xpProperty >= 0
     */
    gte(l: NumberExpression<E, 'gte', Vars>['left'], r: NumberExpression<E, 'gte', Vars>['right']): NumberExpression<E, 'gte', Vars>;

    /**
     * @example xpProperty < 0
     */
    lt(l: NumberExpression<E, 'lt', Vars>['left'], r: NumberExpression<E, 'lt', Vars>['right']): NumberExpression<E, 'lt', Vars>;

    /**
     * @example xpProperty <= 0
     */
    lte(l: NumberExpression<E, 'lte', Vars>['left'], r: NumberExpression<E, 'lte', Vars>['right']): NumberExpression<E, 'lte', Vars>;

    /**
     * @example xpProperty == 0
     */
    eq<T extends Constant>(l: ComparisonExpression<E, 'eq', T, Vars>['left'], r: ComparisonExpression<E, 'eq', T, Vars>['right']): ComparisonExpression<E, 'eq', T, Vars>;

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
    not(r: AnyExpression<E>): UnaryExpression<E, 'not', Vars>;

    /**
     * @example q.var('minXp')
     */
    var(name: ExpressionVariable<Vars>['name']): ExpressionVariable<Vars>;
}

export const OperatorExpressions: QueryOperators<EntityType, any> = {
    gt: (l, r) => new ComparisonExpression('gt', l, r),
    gte: (l, r) => new ComparisonExpression('gte', l, r),
    lt: (l, r) => new ComparisonExpression('lt', l, r),
    lte: (l, r) => new ComparisonExpression('lte', l, r),

    eq: (l, r) => new ComparisonExpression('eq', l, r),

    and: (l, r) => new BooleanExpression('and', l, r),
    or: (l, r) => new BooleanExpression('or', l, r),

    not: r => new UnaryExpression('not', r),

    var: name => new ExpressionVariable(name),
};
