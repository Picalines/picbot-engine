export type PromiseOrSync<T> = Promise<T> | T;

export type PromiseVoid = PromiseOrSync<void>;

export type EmptyObject = { [K: string]: never; [K: number]: never };

/**
 * Объект, который можно освободить из памяти
 */
export interface Disposable {
    /**
     * Освобождает объект из памяти
     */
    dispose(): void;
}

/**
 * Интерфейс функции фильтрации
 */
export interface FilterFunction<T> {
    (value: T): boolean;
}

/**
 * @returns конструктор T
 */
export type AnyConstructor<T> = new (...args: any[]) => T;

/**
 * Partial<T> с возможностью оставить некоторые поля обязательными
 */
export type PartialExcept<T, K extends keyof T> = Partial<T> & Required<Pick<T, K>>;

/**
 * Расширение стандартного Partial<T> из TypeScript
 * https://gist.github.com/navix/6c25c15e0a2d3cd0e5bce999e0086fc9
 */
export type DeepPartial<T> = T extends Function ? T
    : (T extends object ? { [P in keyof T]?: DeepPartial<T[P]>; } : T);

/**
 * DeepPartial<T> с возможностью оставить некоторые поля на самом верхнем уровне обязательными
 */
export type DeepPartialExcept<T, K extends keyof T> = DeepPartial<T> & PartialExcept<T, K>;

/**
 * Массив, который содержит хотя бы 1 элемент
 */
export type NonEmpty<T> = T extends (infer U)[] ? [U, ...U[]] : never;

/**
 * Массив, который содержит хотя бы 1 элемент. Элементы доступны только для чтения
 */
export type NonEmptyReadonly<T> = T extends readonly (infer U)[] ? readonly [U, ...U[]] : never;

/**
 * @example Overwrite<{ a: number, b: number }, { a: 'test' }> -> { a: 'test', b: number }
 */
export type Overwrite<T, U> = Pick<T, Exclude<keyof T, keyof U>> & U;

export type Indexes<Tuple extends any[]> = { [I in keyof Tuple]: I }[number];

export type Mutable<T> = { [K in keyof T]: T[K] };
