import { Property } from "../..";
import { EntityType } from "../Entity";
import { BinaryCompareOperator, BinaryLogicOperator, UnaryOperator } from "./Operator";

/**
 * Возможные типы константы в выражении
 */
export type Constant =
    | number
    | string
    | boolean

/**
 * Класс унарного выражения
 */
export class UnaryExpression<E extends EntityType, O extends UnaryOperator> {
    /**
     * @param operator оператор
     * @param right правая часть выражения
     */
    constructor(
        public readonly operator: O,
        public readonly right: UnaryExpression<E, UnaryOperator> | BinaryExpression<E>,
    ) { }
}

/**
 * Класс выражения сравнения левой и правой части
 */
export class ComparisonExpression<E extends EntityType, O extends BinaryCompareOperator, T extends Constant> {
    /**
     * @param operator оператор
     * @param left левая часть
     * @param right правая часть
     */
    constructor(
        public readonly operator: O,
        public readonly left: Property<E, T>,
        public readonly right: Property<E, T> | T,
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
        public readonly operator: O,
        public readonly left: AnyExpression<E>,
        public readonly right: AnyExpression<E>,
    ) { }
}

/**
 * Бинарное выражение
 */
export type BinaryExpression<E extends EntityType> = ComparisonExpression<E, BinaryCompareOperator, Constant> | BooleanExpression<E, BinaryLogicOperator>;

/**
 * Любое выражение
 */
export type AnyExpression<E extends EntityType> = UnaryExpression<E, UnaryOperator> | BinaryExpression<E>;
