import { EntityType } from "../Entity.js";
import { ComparisonExpression, BooleanExpression, UnaryExpression, AnyExpression, ExpressionConstant, ExpressionVariable, BinaryExpression } from "./Expression.js";
import { SelectorVarsDefinition } from "./Selector.js";

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

type NumberExpression<E extends EntityType, O extends BinaryCompareOperator, Vars extends SelectorVarsDefinition> = ComparisonExpression<E, O, number, Vars>;

type ExpressionMethod<E extends EntityType, Vars extends SelectorVarsDefinition, Ex extends BinaryExpression<E, Vars>> = (l: Ex['left'], r: Ex['right']) => Ex;

type NumberExpressionMethod<E extends EntityType, O extends BinaryCompareOperator, Vars extends SelectorVarsDefinition> = ExpressionMethod<E, Vars, NumberExpression<E, O, Vars>>;

/**
 * Операторы выражения для поиска по базе данных
 */
export interface QueryOperators<E extends EntityType, Vars extends SelectorVarsDefinition> {
    /** @example xpState > 0 */
    readonly gt: NumberExpressionMethod<E, 'gt', Vars>;

    /** @example xpState >= 0 */
    readonly gte: NumberExpressionMethod<E, 'gte', Vars>;

    /** @example xpState < 0 */
    readonly lt: NumberExpressionMethod<E, 'lt', Vars>;

    /** @example xpState <= 0 */
    readonly lte: NumberExpressionMethod<E, 'lte', Vars>;

    /** @example xpState == 0 */
    readonly eq: ExpressionMethod<E, Vars, ComparisonExpression<E, 'eq', ExpressionConstant, Vars>>;

    /** @example (...) && (...) */
    readonly and: (l: AnyExpression<E>, r: AnyExpression<E>) => BooleanExpression<E, 'and'>;

    /** @example (...) || (...) */
    readonly or: (l: AnyExpression<E>, r: AnyExpression<E>) => BooleanExpression<E, 'or'>;

    /** @example !(...) */
    readonly not: (r: AnyExpression<E>) => UnaryExpression<E, 'not', Vars>;

    /** @example q.var('minXp') */
    readonly var: (name: keyof Vars) => ExpressionVariable<Vars>;
}

export const OperatorExpressions: QueryOperators<EntityType, any> = Object.freeze({
    gt: (l, r) => new ComparisonExpression('gt', l, r),
    gte: (l, r) => new ComparisonExpression('gte', l, r),
    lt: (l, r) => new ComparisonExpression('lt', l, r),
    lte: (l, r) => new ComparisonExpression('lte', l, r),

    eq: (l, r) => new ComparisonExpression('eq', l, r),

    and: (l, r) => new BooleanExpression('and', l, r),
    or: (l, r) => new BooleanExpression('or', l, r),

    not: r => new UnaryExpression('not', r),

    var: name => new ExpressionVariable(name),
});
