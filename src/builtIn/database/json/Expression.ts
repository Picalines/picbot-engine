import { Property } from "../../..";
import { Entity } from "../../../database/Entity";
import { AnyExpression, BooleanExpression, UnaryExpression } from "../../../database/Selector/Expression";

/**
 * Выражение селектора в виде функции
 */
export type CompiledExpression = (props: Record<string, any>) => boolean;

/**
 * 'Компилирует' выражение селектора к виду функции
 */
export function compileExpression<E extends Entity>(expression: AnyExpression<E>, usedPropsCache: Set<string>): CompiledExpression {
    if (expression instanceof UnaryExpression) {
        if (expression.operator == 'not') {
            const compiled = compileExpression(expression.right, usedPropsCache);
            return ps => !compiled(ps);
        }

        throw new Error(`unsupported unary operator '${(expression as any).operator}'`);
    }

    if (expression instanceof BooleanExpression) {
        const left = compileExpression(expression.left, usedPropsCache);
        const right = compileExpression(expression.right, usedPropsCache);

        if (expression.operator == 'and') {
            return ps => left(ps) && right(ps);
        }

        return ps => left(ps) || right(ps);
    }

    const leftProp = expression.left.key;
    usedPropsCache.add(leftProp);

    if (expression.right instanceof Property) {
        const rightProp = expression.right.key;
        usedPropsCache.add(rightProp);

        switch (expression.operator) {
            default: throw new Error(`unsupported binary operator '${(expression as any).operator}'`);
            case 'eq': return ps => ps[leftProp] == ps[rightProp];
            case 'gt': return ps => ps[leftProp] > ps[rightProp];
            case 'gte': return ps => ps[leftProp] >= ps[rightProp];
            case 'lt': return ps => ps[leftProp] < ps[rightProp];
            case 'lte': return ps => ps[leftProp] <= ps[rightProp];
        }
    }

    const rightValue = expression.right;

    switch (expression.operator) {
        default: throw new Error(`unsupported binary operator '${(expression as any).operator}'`);
        case 'eq': return ps => ps[leftProp] == rightValue;
        case 'gt': return ps => ps[leftProp] > rightValue;
        case 'gte': return ps => ps[leftProp] >= rightValue;
        case 'lt': return ps => ps[leftProp] < rightValue;
        case 'lte': return ps => ps[leftProp] <= rightValue;
    }
}
