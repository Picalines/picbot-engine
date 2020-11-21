export type PromiseOrSync<T> = Promise<T> | T;

export type PromiseVoid = PromiseOrSync<void>;

/**
 * Расширение стандартного Partial<T> из TypeScript
 * https://gist.github.com/navix/6c25c15e0a2d3cd0e5bce999e0086fc9
 */
export type DeepPartial<T> = T extends Function ? T
    : (T extends object ? { [P in keyof T]?: DeepPartial<T[P]>; } : T);

/**
 * Массив, который содержит хотя бы 1 элемент
 */
export type NonEmpty<T> = T extends Array<infer U> ? U[] & { '0': U } : never;

/**
 * Массив, который содержит хотя бы 1 элемент. Элементы доступны только для чтения
 */
export type NonEmptyReadonly<T> = T extends ReadonlyArray<infer U> ? ReadonlyArray<U> & { '0': U } : never;

/**
 * @example Overwrite<{ a: number, b: number }, { a: 'test' }> -> { a: 'test', b: number }
 */
export type Overwrite<T, U> = Pick<T, Exclude<keyof T, keyof U>> & U;
