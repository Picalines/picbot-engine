export type PromiseOrSync<T> = Promise<T> | T;

export type PromiseVoid = PromiseOrSync<void>;

export type EmptyObject = { [K: string]: never;[K: number]: never };

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
 * @author https://gist.github.com/navix/6c25c15e0a2d3cd0e5bce999e0086fc9
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

/**
 * Индексы массива
 */
export type Indexes<Tuple extends any[]> = { [I in keyof Tuple]: I }[number];

/**
 * Противоположность Readonly<T>
 */
export type Mutable<T> = { [K in keyof T]: T[K] };

//#region TupleOf

type BuildPowersOf2LengthArrays<N extends number, R extends never[][]> =
    R[0][N] extends never ? R : BuildPowersOf2LengthArrays<N, [[...R[0], ...R[0]], ...R]>;

type ConcatLargestUntilDone<N extends number, R extends never[][], B extends never[]> =
    B["length"] extends N ? B : [...R[0], ...B][N] extends never
    ? ConcatLargestUntilDone<N, R extends [R[0], ...infer U] ? U extends never[][] ? U : never : never, B>
    : ConcatLargestUntilDone<N, R extends [R[0], ...infer U] ? U extends never[][] ? U : never : never, [...R[0], ...B]>;

type Replace<R extends any[], T> = { [K in keyof R]: T }

/**
 * Массив фиксированной длины
 * @author https://github.com/microsoft/TypeScript/issues/26223#issuecomment-674514787
 */
export type TupleOf<T, N extends number> = number extends N ? T[] : {
    [K in N]:
    BuildPowersOf2LengthArrays<K, [[never]]> extends infer U ? U extends never[][]
    ? Replace<ConcatLargestUntilDone<K, U, []>, T> : never : never;
}[N]

//#endregion
