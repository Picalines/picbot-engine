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
 * @returns функцию, которая либо читает аргумент, либо возвращает _default, если аргумент не найден
 * @param reader функция, читающая аргумент
 */
export const optionalReader = <T, D extends T | null>(reader: ArgumentReader<T>, _default: InferPrimitive<D>): ArgumentReader<T | InferPrimitive<D>> => {
    return (userInput, message) => {
        const result = reader(userInput, message);
        if (result.isError && !userInput.length) {
            return { isError: false, value: { length: 0, parsedValue: _default } };
        }
        return result;
    };
}

/**
 * Читает пробелы между аргументами
 */
export const spaceReader: ArgumentReader<string> = regexReader(/\s+/);
