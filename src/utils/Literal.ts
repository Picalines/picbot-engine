export type Primitive =
    | string
    | symbol
    | number
    | bigint
    | boolean
    | null
    | undefined;

export type PrimitiveConstructor<T extends NonNullable<Primitive> = NonNullable<Primitive>> = T extends string ? StringConstructor
    : T extends symbol ? SymbolConstructor
    : T extends number ? NumberConstructor
    : T extends bigint ? BigIntConstructor
    : T extends boolean ? BooleanConstructor
    : T;

export type PrimitiveInstanceType<T extends PrimitiveConstructor<NonNullable<Primitive>>> = T extends (value?: any) => infer P ? P : never;
