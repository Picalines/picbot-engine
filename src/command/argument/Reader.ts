import { GuildMessage, InferPrimitive, ValueParser } from "../../utils";
import { regexReader } from "../../builtIn/reader/regex";

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
 * Ошибка чтения аргумента
 */
export type ArgumentReaderError = 'notFound' | { message: string };

/**
 * Интерфейс функции, читающей аргумент
 */
export interface ArgumentReader<T> extends ValueParser<string, ArgumentString<T>, GuildMessage, ArgumentReaderError> { }

/**
 * Читает пробелы между аргументами
 */
export const spaceReader: ArgumentReader<string> = regexReader(/\s+/);
