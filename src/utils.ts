import type { Guild, GuildMember, Message, TextChannel } from "discord.js";

/**
 * Сообщение в текстовом канале на сервере
 */
export type GuildMessage = Message & {
    guild: Guild & { me: GuildMember },
    channel: TextChannel,
    member: GuildMember,
};

/**
 * Сообщение бота в текстовом канале на сервере
 */
export type GuildBotMessage = GuildMessage & {
    guild: { me: { bot: true } },
};

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

/**
 * Вспомогательный тип для функций. Если какая-то операция прошла успешно,
 * функция возвращает объект этого типа со значениями `isError: false, value: R`.
 * Иначе `isError: true, error: E`
 */
export type Failable<R, E> = {
    isError: true,
    error: E,
} | {
    isError: false,
    value: R,
};

/**
 * Интерфейс функции, которая переводит значение From в To
 * @returns [[Failable]].
 */
export interface ValueParser<From, To, Context, Error> {
    (value: From, context: Context): Failable<To, Error>;
}

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

/**
 * Является ли объект литералом (скорее всего)
 * @param obj объект
 */
export function isPlainObject(obj: any): boolean {
    return typeof obj === 'object' && obj !== null
        && obj.constructor === Object
        && Object.prototype.toString.call(obj) === '[object Object]';
}

/**
 * @param origin оригинальный объект
 * @param override объект со значениями для переписывания оригинала
 */
export function deepMerge<T>(origin: T, override: Partial<T>): T {
    const copy: T = {} as any;

    for (const key in origin) {
        if (override[key] === undefined) {
            copy[key] = origin[key];
            continue;
        }
        if (isPlainObject(origin[key]) && isPlainObject(override[key])) {
            copy[key] = deepMerge(origin[key], override[key]!);
        }
        else {
            copy[key] = override[key]!;
        }
    }

    return copy;
}

/**
 * Функция фильтрации, используящая генератор
 * @param iterable итерируемый объект
 * @param filter функция фильтрации
 */
export function* filterIterable<T>(iterable: IterableIterator<T>, filter: (v: T) => boolean): IterableIterator<T> {
    for (const value of iterable) {
        if (filter(value)) {
            yield value;
        }
    }
}
