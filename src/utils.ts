import { Message, Guild, TextChannel, GuildMember } from "discord.js";

/**
 * Сообщение в текстовом канале на сервере (Вспомогательный тип)
 */
export type GuildMessage = Message & {
    guild: Guild & { me: GuildMember },
    channel: TextChannel & { type: 'text' },
    member: GuildMember,
}

export type PromiseVoid = Promise<void> | void

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
