import { ArgumentReader } from "../Argument.js";
import { parsedRegexReader } from "./Regex.js";
import { argumentReaderTerms as readerTerms } from "./terms/Terms.js";

export const numberReader = (type: 'int' | 'float', range?: [min: number, max: number]): ArgumentReader<number> => {
    range ??= [-Infinity, Infinity];

    const parseNumber = type == 'int' ? parseInt : parseFloat;
    const inRange = (n: number) => n >= range![0] && n <= range![1];

    return parsedRegexReader(/[+-]?\d+(\.\d*)?/, (numberInput, context) => {
        const number = parseNumber(numberInput);
        if (isNaN(number) || !inRange(number)) {
            return { isError: true, error: context.translate(readerTerms).numberIsNotInRange({ number, min: range![0], max: range![1] }) }
        }
        return { isError: false, value: number };
    });
};
