import { Property } from "../property";
import { EntityType } from "../Entity";
import { AnyExpression, BooleanExpression, ExpressionVariable, UnaryExpression } from "../selector";

export type CompiledExpression = (props: Record<string, any>, vars: Record<string, any>) => boolean;

export function compileExpression<E extends EntityType>(expression: AnyExpression<E>, usedPropsCache: Set<string>): CompiledExpression {
    if (expression instanceof UnaryExpression) {
        if (expression.operator == 'not') {
            const compiled = compileExpression(expression.right, usedPropsCache);
            return (ps, vars) => !compiled(ps, vars);
        }

        throw new Error(`unsupported unary operator '${(expression as any).operator}'`);
    }

    if (expression instanceof BooleanExpression) {
        const left = compileExpression(expression.left, usedPropsCache);
        const right = compileExpression(expression.right, usedPropsCache);

        if (expression.operator == 'and') {
            return (ps, vars) => left(ps, vars) && right(ps, vars);
        }

        return (ps, vars) => left(ps, vars) || right(ps, vars);
    }

    const leftProp = expression.left.key;
    usedPropsCache.add(leftProp);

    if (expression.right instanceof Property) {
        const rightProp = expression.right.key;
        usedPropsCache.add(rightProp);

        switch (expression.operator) {
            case 'eq': return ps => ps[leftProp] === ps[rightProp];
            case 'gt': return ps => ps[leftProp] > ps[rightProp];
            case 'gte': return ps => ps[leftProp] >= ps[rightProp];
            case 'lt': return ps => ps[leftProp] < ps[rightProp];
            case 'lte': return ps => ps[leftProp] <= ps[rightProp];
        }
    }

    const rightValue = expression.right;

    if (rightValue instanceof ExpressionVariable) {
        const varName = rightValue.name as string;
        switch (expression.operator) {
            case 'eq': return (ps, vars) => ps[leftProp] === vars[varName];
            case 'gt': return (ps, vars) => ps[leftProp] > vars[varName];
            case 'gte': return (ps, vars) => ps[leftProp] >= vars[varName];
            case 'lt': return (ps, vars) => ps[leftProp] < vars[varName];
            case 'lte': return (ps, vars) => ps[leftProp] <= vars[varName];
        }
    }

    switch (expression.operator) {
        case 'eq': return ps => ps[leftProp] === rightValue;
        case 'gt': return ps => ps[leftProp] > rightValue;
        case 'gte': return ps => ps[leftProp] >= rightValue;
        case 'lt': return ps => ps[leftProp] < rightValue;
        case 'lte': return ps => ps[leftProp] <= rightValue;
    }
}
