import { State } from "../state/index.js";
import { EntityType } from "../Entity.js";
import { AnyExpression, BooleanExpression, ExpressionVariable } from "../selector/index.js";

export type CompiledExpression = (state: Record<string, any>, vars: Record<string, any>) => boolean;

export function compileExpression<E extends EntityType>(expression: AnyExpression<E, any>): CompiledExpression {
    if (expression instanceof BooleanExpression) {
        const subExpressions = expression.subExpressions.map(compileExpression);

        if (expression.operator == 'not') {
            return (ps, vars) => !subExpressions[0]!(ps, vars);
        }

        if (expression.operator == 'and') {
            return (ps, vars) => subExpressions.every(e => e(ps, vars));
        }

        return (ps, vars) => subExpressions.some(e => e(ps, vars));
    }

    const leftProp = expression.left.name;

    if (expression.right instanceof State) {
        const rightProp = expression.right.name;

        switch (expression.operator) {
            case 'eq': return ps => ps[leftProp] === ps[rightProp];
            case 'ne': return ps => ps[leftProp] !== ps[rightProp];
            case 'gt': return ps => ps[leftProp] > ps[rightProp];
            case 'lt': return ps => ps[leftProp] < ps[rightProp];
            case 'gte': return ps => ps[leftProp] >= ps[rightProp];
            case 'lte': return ps => ps[leftProp] <= ps[rightProp];
        }
    }

    const rightValue = expression.right;

    if (rightValue instanceof ExpressionVariable) {
        const varName = rightValue.name as string;
        switch (expression.operator) {
            case 'eq': return (ps, vars) => ps[leftProp] === vars[varName];
            case 'ne': return (ps, vars) => ps[leftProp] !== vars[varName];
            case 'gt': return (ps, vars) => ps[leftProp] > vars[varName];
            case 'lt': return (ps, vars) => ps[leftProp] < vars[varName];
            case 'gte': return (ps, vars) => ps[leftProp] >= vars[varName];
            case 'lte': return (ps, vars) => ps[leftProp] <= vars[varName];
        }
    }

    switch (expression.operator) {
        case 'eq': return ps => ps[leftProp] === rightValue;
        case 'ne': return ps => ps[leftProp] !== rightValue;
        case 'gt': return ps => ps[leftProp] > rightValue;
        case 'lt': return ps => ps[leftProp] < rightValue;
        case 'gte': return ps => ps[leftProp] >= rightValue;
        case 'lte': return ps => ps[leftProp] <= rightValue;
    }
}
