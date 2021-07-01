import { NonEmpty } from "../../utils/index.js";
import { EntityType } from "../Entity.js";
import { ComparisonExpression, BooleanExpression, AnyExpression, ExpressionVariable, ComparsionOperator } from "./Expression.js";
import { SelectorVars } from "./Selector.js";

type ComparsionExpressionMethod<E extends EntityType, O extends ComparsionOperator<T>, T, Vars extends SelectorVars>
    = <U extends T>(l: ComparisonExpression<E, O, U, Vars>['left'], r: ComparisonExpression<E, O, U, Vars>['right']) => ComparisonExpression<E, O, T, Vars>

export interface QueryOperators<E extends EntityType, Vars extends SelectorVars> {
    readonly gt: ComparsionExpressionMethod<E, 'gt', number, Vars>;
    readonly gte: ComparsionExpressionMethod<E, 'gte', number, Vars>;
    readonly lt: ComparsionExpressionMethod<E, 'lt', number, Vars>;
    readonly lte: ComparsionExpressionMethod<E, 'lte', number, Vars>;

    readonly eq: ComparsionExpressionMethod<E, 'eq', any, Vars>;
    readonly ne: ComparsionExpressionMethod<E, 'ne', any, Vars>;

    readonly and: (...exprs: NonEmpty<AnyExpression<E, Vars>[]>) => BooleanExpression<E, 'and', Vars>;
    readonly or: (...exprs: NonEmpty<AnyExpression<E, Vars>[]>) => BooleanExpression<E, 'or', Vars>;
    readonly not: (r: AnyExpression<E, Vars>) => BooleanExpression<E, 'not', Vars>;

    readonly var: <T>(name: ExpressionVariable<Vars, T>['name']) => ExpressionVariable<Vars, T>;
}

export const QueryOperators = <QueryOperators<EntityType, any>>Object.freeze({
    gt: (l, r) => new ComparisonExpression('gt' as any, l, r),
    gte: (l, r) => new ComparisonExpression('gte' as any, l, r),
    lt: (l, r) => new ComparisonExpression('lt' as any, l, r),
    lte: (l, r) => new ComparisonExpression('lte' as any, l, r),

    eq: (l, r) => new ComparisonExpression('eq', l, r),
    ne: (l, r) => new ComparisonExpression('ne', l, r),

    and: (...exprs) => new BooleanExpression('and', ...exprs),
    or: (...exprs) => new BooleanExpression('or', ...exprs),
    not: r => new BooleanExpression('not', r),

    var: name => new ExpressionVariable(name as any),
});
