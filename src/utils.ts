import { Message, Guild, TextChannel, GuildMember } from "discord.js";

/**
 * Сообщение в текстовом канале на сервере
 */
export type GuildMessage = Message & {
    guild: Guild & { me: GuildMember },
    channel: TextChannel & { type: 'text' },
    member: GuildMember,
}

/**
 * Сообщение бота в текстовом канале на сервере
 */
export type GuildBotMessage = GuildMessage & {
    guild: { me: { bot: true } },
}

export type PromiseVoid = Promise<void> | void

/**
 * Расширение стандартного Partial<T> из TypeScript
 * https://gist.github.com/navix/6c25c15e0a2d3cd0e5bce999e0086fc9
 */
export type DeepPartial<T> = T extends Function ? T
    : (T extends object ? { [P in keyof T]?: DeepPartial<T[P]>; } : T);

/**
 * Массив, который содержит хотя бы 1 элемент
 */
export type NonEmptyArray<T> = [T, ...T[]]

/**
 * Массив, который содержит хотя бы 1 элемент. Элементы доступны только для чтения
 */
export type ReadOnlyNonEmptyArray<T> = Readonly<[T, ...T[]]>

/**
 * Возвращает имя свойства
 * @param name имя свойства
 */
export function nameof<T>(name: Extract<keyof T, string>): string {
    return name;
}

/**
 * Вспомогательный тип для функций. Если какая-то операция прошла успешно,
 * функция возвращает объект этого типа со значениеми `isError: false, value: R`.
 * Иначе `isError: true, error: E`
 */
export type Failable<R, E> = {
    isError: true,
    error: E,
} | {
    isError: false,
    value: R,
}

/**
 * Приводит ритералы к примитивным типам
 * https://stackoverflow.com/questions/56332310/how-to-prevent-a-literal-type-in-typescript
 */
export type WidenLiteral<T> =
    T extends boolean ? boolean :
    T extends string ? string :
    T extends number ? number :
    T;
