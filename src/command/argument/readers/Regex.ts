import { ArgumentReader, Parser } from "../Argument.js";
import { CommandContext } from "../../Context.js";
import { argumentReaderTerms as readerTerms } from "./terms/Terms.js";

export const regexReader = (regex: RegExp): ArgumentReader<string> => {
    if (!regex.source.startsWith('^')) {
        regex = new RegExp('^' + regex.source);
    }
    return (userInput, context) => {
        const firstMatch = userInput.match(regex)?.[0];
        if (firstMatch === undefined) {
            return { isError: true, error: context.translate(readerTerms).notFound };
        }
        return {
            isError: false,
            value: { length: firstMatch.length, parsedValue: firstMatch },
        };
    };
};

export const parsedRegexReader = <T>(regex: RegExp, parser: Parser<string, T, CommandContext<unknown[]>, string>): ArgumentReader<T> => {
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
};
