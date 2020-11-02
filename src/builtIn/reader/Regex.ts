import { GuildMessage, ValueParser } from "../../utils";
import { ArgumentReader } from "../../command/Argument/Reader";

/**
 * Читает аргумент по регулярному выражению
 * @param regex регулярное выражение
 */
export const regexReader = (regex: RegExp): ArgumentReader<string> => {
    if (!regex.source.startsWith('^')) {
        regex = new RegExp('^' + regex.source);
    }
    return userInput => {
        const firstMatch = userInput.match(regex)?.[0];
        if (firstMatch === undefined) {
            return { isError: true, error: 'notFound' };
        }
        return {
            isError: false,
            value: { length: firstMatch.length, parsedValue: firstMatch },
        };
    };
}

/**
 * Читает аргумент по регулярному выражению, а затем переводит его с помощью парсера
 * @param regex регулярное выражение
 * @param parser функция парсер
 */
export const parsedRegexReader = <T>(regex: RegExp, parser: ValueParser<string, T, GuildMessage, { message: string }>): ArgumentReader<T> => {
    const reader = regexReader(regex);
    return (userInput, message) => {
        const result = reader(userInput, message);
        if (result.isError) {
            return result;
        }
        const parsed = parser(result.value.parsedValue, message);
        if (parsed.isError) {
            return parsed;
        }
        return {
            isError: false,
            value: { length: result.value.length, parsedValue: parsed.value },
        };
    };
}
