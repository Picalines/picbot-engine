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
export type NonEmptyArray<T> = [T, ...T[]];

/**
 * Массив, который содержит хотя бы 1 элемент. Элементы доступны только для чтения
 */
export type ReadOnlyNonEmptyArray<T> = Readonly<[T, ...T[]]>;

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

export function isPlainObject(obj: any): boolean {
    return typeof obj === 'object' && obj !== null
        && obj.constructor === Object
        && Object.prototype.toString.call(obj) === '[object Object]';
}

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

export function* filterIterable<T>(iterable: IterableIterator<T>, filter: (v: T) => boolean): IterableIterator<T> {
    for (const value of iterable) {
        if (filter(value)) {
            yield value;
        }
    }
}
