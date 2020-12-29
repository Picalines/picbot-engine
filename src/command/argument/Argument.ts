import { ValueParser } from "../../utils";
import { CommandContext } from "../Context";

/**
 * Информация прочитанного аргумента
 */
export interface ArgumentString<T> {
    /**
     * Длина строки аргумента
     */
    readonly length: number;

    /**
     * Переведённое значение аргумента
     */
    readonly parsedValue: T;
}

/**
 * Интерфейс функции, читающей аргумент
 */
export type ArgumentReader<T> = ValueParser<string, ArgumentString<T>, CommandContext<unknown[]>, string>;

/**
 * Список объявлений аргументов
 */
export type ArgsDefinitions<Args extends unknown[]> = { readonly [K in keyof Args]: CommandArgument<Args[K]> };

/**
 * Интерфейс аргумента комманды
 */
export interface CommandArgument<T> {
    /**
     * Имя аргумента команды
     */
    readonly name: string;

    /**
     * Описание аргумента
     */
    readonly description?: string;

    /**
     * @returns функцию, читающаю аргумент
     */
    readonly reader: ArgumentReader<T>;
}
