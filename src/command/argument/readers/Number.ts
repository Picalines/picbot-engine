import { ArgumentReader } from "../Argument.js";
import { parsedRegexReader } from "./Regex.js";
import { argumentReaderTerms as readerTerms } from "./Terms.js";

export const numberReader = (type: 'int' | 'float', range?: [min: number, max: number]): ArgumentReader<number> => {
    const parseNumber = type == 'int' ? parseInt : parseFloat;

    let inRange: (n: number) => boolean;
    if (range) {
        inRange = n => n >= range![0] && n <= range![1];
    }
    else {
        inRange = () => true;
        range = [-Infinity, Infinity];
    }

    return parsedRegexReader(/[+-]?\d+(\.\d*)?/, (numberInput, context) => {
        const number = parseNumber(numberInput);
        if (isNaN(number) || !inRange(number)) {
            return { isError: true, error: context.translate(readerTerms).numberIsNotInRange({ number, min: range![0], max: range![1] }) }
        }
        return { isError: false, value: number };
    });
};
