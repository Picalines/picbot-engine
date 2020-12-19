import { Property } from "../property";
import { EntityType } from "../Entity";
import { BinaryCompareOperator, BinaryLogicOperator, UnaryOperator } from "./Operator";
import { SelectorVars } from "./Selector";

/**
 * Возможные типы константы в выражении
 */
export type Constant =
    | number
    | string
    | boolean

/**
 * Класс переменной в выражении
 */
export class ExpressionVariable<Vars extends SelectorVars> {
    constructor(
        readonly name: keyof Vars
    ) { }
}

/**
 * Класс унарного выражения
 */
export class UnaryExpression<E extends EntityType, O extends UnaryOperator, Vars extends SelectorVars> {
    /**
     * @param operator оператор
     * @param right правая часть выражения
     */
    constructor(
        readonly operator: O,
        readonly right: UnaryExpression<E, UnaryOperator, Vars> | BinaryExpression<E, Vars>,
    ) { }
}

/**
 * Класс выражения сравнения левой и правой части
 */
export class ComparisonExpression<E extends EntityType, O extends BinaryCompareOperator, T extends Constant, Vars extends SelectorVars> {
    /**
     * @param operator оператор
     * @param left левая часть
     * @param right правая часть
     */
    constructor(
        readonly operator: O,
        readonly left: Property<E, T>,
        readonly right: Property<E, T> | T | ExpressionVariable<Vars>,
    ) { }
}

/**
 * Класс булевого выражения
 */
export class BooleanExpression<E extends EntityType, O extends BinaryLogicOperator> {
    /**
     * @param operator оператор
     * @param left левая часть
     * @param right правая часть
     */
    constructor(
        readonly operator: O,
        readonly left: AnyExpression<E>,
        readonly right: AnyExpression<E>,
    ) { }
}

/**
 * Бинарное выражение
 */
export type BinaryExpression<E extends EntityType, Vars extends SelectorVars> =
    | ComparisonExpression<E, BinaryCompareOperator, any, Vars>
    | BooleanExpression<E, BinaryLogicOperator>;

/**
 * Любое выражение
 */
export type AnyExpression<E extends EntityType> =
    | UnaryExpression<E, UnaryOperator, any>
    | BinaryExpression<E, any>;
