import { ValueParser } from "../../../utils";
import { ArgumentReader } from "../Argument";
import { CommandContext } from "../../Context";
import { argumentReaderTerms as readerTerms } from "./Terms";

/**
 * Читает аргумент по регулярному выражению
 * @param regex регулярное выражение
 */
export const regexReader = (regex: RegExp): ArgumentReader<string> => {
    if (!regex.source.startsWith('^')) {
        regex = new RegExp('^' + regex.source);
    }
    return (userInput, context) => {
        const firstMatch = userInput.match(regex)?.[0];
        if (firstMatch === undefined) {
            return { isError: true, error: context.translator(readerTerms)('notFound') };
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
export const parsedRegexReader = <T>(regex: RegExp, parser: ValueParser<string, T, CommandContext<unknown[]>, string>): ArgumentReader<T> => {
    const reader = regexReader(regex);
    return (userInput, context) => {
        const result = reader(userInput, context);
        if (result.isError) {
            return result;
        }
        const parsed = parser(result.value.parsedValue, context);
        if (parsed.isError) {
            return parsed;
        }
        return {
            isError: false,
            value: { length: result.value.length, parsedValue: parsed.value },
        };
    };
}
