import { ArgumentReader } from "../../command/argument/Reader";
import { parsedRegexReader } from "./regex";

/**
 * Читает число (целое / дробное, положительное / отрицательное)
 */
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

    return parsedRegexReader(/[+-]?\d+(\.\d*)?/, numberInput => {
        const number = parseNumber(numberInput);
        if (isNaN(number)) {
            return { isError: true, error: `'${numberInput}' is not a number (${type})` };
        }
        if (!inRange(number)) {
            return { isError: true, error: `${numberInput} is not in range [${range!.slice(0, 2)}]` }
        }
        return { isError: false, value: number };
    });
};
