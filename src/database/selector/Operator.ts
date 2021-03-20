import { EntityType } from "../Entity.js";
import { State } from "../state/State.js";
import { ComparisonExpression, BooleanExpression, UnaryExpression, AnyExpression, ExpressionConstant, ExpressionVariable, BinaryExpression } from "./Expression.js";
import { SelectorVars } from "./Selector.js";

export type UnaryOperator = 'not';

export type BinaryLogicOperator =
    | 'and'
    | 'or';

export type BinaryCompareOperator =
    | 'gt'
    | 'gte'
    | 'lt'
    | 'lte'
    | 'eq';

export type BinaryOperator =
    | BinaryCompareOperator
    | BinaryLogicOperator;

type NumberExpression<E extends EntityType, O extends BinaryCompareOperator, Vars extends SelectorVars>
    = ComparisonExpression<E, O, number, Vars>;

type NumberExpressionMethod<E extends EntityType, O extends BinaryCompareOperator, Vars extends SelectorVars>
    = (l: NumberExpression<E, O, Vars>['left'], r: NumberExpression<E, O, Vars>['right']) => NumberExpression<E, O, Vars>;

/**
 * Операторы выражения для поиска по базе данных
 */
export interface QueryOperators<E extends EntityType, Vars extends SelectorVars> {
    /** @example xpState > 0 */
    readonly gt: NumberExpressionMethod<E, 'gt', Vars>;

    /** @example xpState >= 0 */
    readonly gte: NumberExpressionMethod<E, 'gte', Vars>;

    /** @example xpState < 0 */
    readonly lt: NumberExpressionMethod<E, 'lt', Vars>;

    /** @example xpState <= 0 */
    readonly lte: NumberExpressionMethod<E, 'lte', Vars>;

    /** @example xpState == 0 */
    readonly eq: <T>(left: State<E, T>, right: T | State<E, T> | ExpressionVariable<Vars>) => ComparisonExpression<E, 'eq', T, Vars>;

    /** @example (...) && (...) */
    readonly and: (...exprs: [AnyExpression<E>, ...AnyExpression<E>[]]) => BooleanExpression<E, 'and'>;

    /** @example (...) || (...) */
    readonly or: (...exprs: [AnyExpression<E>, ...AnyExpression<E>[]]) => BooleanExpression<E, 'or'>;

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

    and: (...exprs) => new BooleanExpression('and', ...exprs),
    or: (...exprs) => new BooleanExpression('or', ...exprs),

    not: r => new UnaryExpression('not', r),

    var: name => new ExpressionVariable(name),
});
