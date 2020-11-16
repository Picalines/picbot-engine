import { ValueParser } from "../../utils";
import { CommandContext } from "../Context";
import { CommandArgument } from "./Definition";

/**
 * Информация прочитанного аргумента
 */
export interface ArgumentString<T> {
    /**
     * Длина строки аргумента
     */
    length: number;
    /**
     * Переведённое значение аргумента
     */
    parsedValue: T;
}

/**
 * Интерфейс функции, читающей аргумент
 */
export type ArgumentReader<T> = ValueParser<string, ArgumentString<T>, CommandContext<unknown[]>, string>;

/**
 * Список объявлений аргументов
 */
export type ArgsDefinitions<Args extends any[]> = readonly [...{ [K in keyof Args]: CommandArgument<Args[K]> }];

export interface CommandArgumentsReader<Args extends any[]> {
    /**
     * Список объявлений аргументов
     */
    readonly definitions: ArgsDefinitions<Args>;

    /**
     * Читает аргументы команды из сообщения
     * @param userInput ввод пользователя
     * @param context контекст команды
     */
    readArguments(userInput: string, context: CommandContext<unknown[]>): Args;
}
