import { Property } from "../../..";
import { Entity } from "../../../database/Entity";
import { AnyExpression, BooleanExpression, UnaryExpression } from "../../../database/Selector/Expression";

export type CompiledExpression = (props: Record<string, any>) => boolean;

export function compileExpression<E extends Entity>(expression: AnyExpression<E>): CompiledExpression {
    if (expression instanceof UnaryExpression) {
        if (expression.operator == 'not') {
            const compiled = compileExpression(expression.right);
            return ps => !compiled(ps);
        }

        throw new Error(`unsupported unary operator '${(expression as any).operator}'`);
    }

    if (expression instanceof BooleanExpression) {
        const left = compileExpression(expression.left);
        const right = compileExpression(expression.right);

        if (expression.operator == 'and') {
            return ps => left(ps) && right(ps);
        }

        return ps => left(ps) || right(ps);
    }

    const leftProp = expression.left.key;

    if (expression.right instanceof Property) {
        const rightProp = expression.right.key;

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
