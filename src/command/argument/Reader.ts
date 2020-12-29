import { ValueParser } from "../../utils";
import { CommandContext } from "../Context";
import { CommandArgument } from "./Argument";

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
