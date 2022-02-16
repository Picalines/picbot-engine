export type NoInfer<T> = [T][T extends any ? 0 : never];

export type PromiseOrSync<T> = Promise<T> | T;

export type PromiseVoid = PromiseOrSync<void>;

export type AnyConstructor<T = any> = new (...args: any) => T;

/**
 * @author https://gist.github.com/navix/6c25c15e0a2d3cd0e5bce999e0086fc9
 */
export type DeepPartial<T> = T extends Function ? T : (T extends object ? { [P in keyof T]?: DeepPartial<T[P]> } : T);

export type NonEmpty<T> = T extends readonly (infer U)[] ? [U, ...U[]] : never;

/**
 * @example Overwrite<{ a: number, b: number }, { a: 'test' }> -> { a: 'test', b: number }
 */
export type Overwrite<T, U> = Pick<T, Exclude<keyof T, keyof U>> & U;

export type Indexes<Tuple extends any[]> = { [I in keyof Tuple]: I }[number];

export type UnionToIntersection<U> = (U extends any ? (k: U) => void : never) extends ((k: infer I) => void) ? I : never;

export type Switch<T, Cases extends [_case: any, result: any][]>
    = Exclude<
        { [C in keyof Cases]: Cases[C] extends [any, any] ? T extends Cases[C][0] ? Cases[C][1] : never : never }[number],
        never
    >;

export type Primitive =
    | string
    | symbol
    | number
    | bigint
    | boolean
    | null
    | undefined;

export type PrimitiveConstructor =
    | StringConstructor
    | SymbolConstructor
    | NumberConstructor
    | BigIntConstructor
    | BooleanConstructor;

export type PrimitiveConstructorInstance<T extends PrimitiveConstructor> = Switch<T, [
    [StringConstructor, string],
    [SymbolConstructor, symbol],
    [NumberConstructor, number],
    [BigIntConstructor, bigint],
    [BooleanConstructor, boolean],
]>;

/**
 * @example
 * type NameLiteral<T extends Literal<string, T>> = T;
 * NameLiteral<string> // error
 * NameLiteral<'name'> // fine
 */
export type Literal<L extends Primitive, I> = L extends I ? never : L;
