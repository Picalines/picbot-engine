/**
 * Примитивные типы JavaScript
 */
export type Primitive =
    | string
    | symbol
    | number
    | bigint
    | boolean
    | null
    | undefined;

/**
 * Конструкторы примитивов JavaScript
 */
export type PrimitiveConstructor<T extends NonNullable<Primitive> = NonNullable<Primitive>> = T extends string ? StringConstructor
    : T extends symbol ? SymbolConstructor
    : T extends number ? NumberConstructor
    : T extends bigint ? BigIntConstructor
    : T extends boolean ? BooleanConstructor
    : T;

/**
 * Возвращает тип примитива из конструктора
 */
export type PrimitiveInstanceType<T extends PrimitiveConstructor<NonNullable<Primitive>>> = T extends (value?: any) => infer P ? P : never;

/**
 * Если T является литералом, он "расширится" (`'abc'` -> `string`)
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
