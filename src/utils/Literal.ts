/**
 * Примитивные типы JavaScript
 */
export type Primitive = string | symbol | number | bigint | boolean | null | undefined;

/**
 * Если T является примитивным типом, то он остаётся литералом
 */
export type WidenLiteral<T> = T extends string ? string
    : T extends symbol ? symbol
    : T extends number ? number
    : T extends bigint ? bigint
    : T extends boolean ? boolean
    : T extends null ? null
    : T extends undefined ? undefined
    : T;

/**
 * Используется для того, чтобы TypeScript определял generic как литерал
 */
export type InferPrimitive<T> = T extends Primitive ? T : WidenLiteral<T>;
