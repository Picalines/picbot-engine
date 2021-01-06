import { TupleOf } from "../../../utils";
import { ArgumentReader } from "../Argument";
import { spaceReader } from "./String";
import { argumentReaderTerms as readerTerms } from "./Terms";

export const optionalReader = <T, D extends T | null | undefined>(reader: ArgumentReader<T>, defaultValue: D): ArgumentReader<T | D> => (userInput, context) => {
    const result = reader(userInput, context);
    if (result.isError && !userInput.length) {
        return { isError: false, value: { length: 0, parsedValue: defaultValue } };
    }
    return result;
}

export const mergeReaders = <T extends any[]>(...readers: { [K in keyof T]: ArgumentReader<T[K]> }): ArgumentReader<T> => (userInput, context) => {
    const values: T = [] as any;
    let length = 0;

    for (let index = 0; index < readers.length; index++) {
        const valResult = readers[index](userInput.slice(length), context);
        if (valResult.isError) {
            return {
                isError: true,
                error: context.translate(readerTerms).errorInItem({ index, error: valResult.error }),
            };
        }

        values.push(valResult.value.parsedValue);
        length += valResult.value.length;

        const spaceResult = spaceReader(userInput.slice(length), context);
        if (!spaceResult.isError) {
            length += spaceResult.value.length;
        }
    }

    return { isError: false, value: { length, parsedValue: values } };
}

export const repeatReader = <T, L extends number>(reader: ArgumentReader<T>, count: L): ArgumentReader<TupleOf<T, L>> => {
    const readers = new Array(count).fill(reader) as TupleOf<ArgumentReader<T>, L>;
    return mergeReaders(...readers) as any;
}

export const restReader = <T, L extends number>(reader: ArgumentReader<T>, atLeast?: L): ArgumentReader<TupleOf<T, L> & T[]> => {
    return (userInput, context) => {
        const values = [];
        let length = 0, index = 0;

        while (length < userInput.length) {
            const valResult = reader(userInput.slice(length), context);
            if (valResult.isError) {
                return {
                    isError: true,
                    error: context.translate(readerTerms).errorInItem({ index, error: valResult.error }),
                };
            }

            values.push(valResult.value.parsedValue);
            length += valResult.value.length;

            const spaceResult = spaceReader(userInput.slice(length), context);
            if (!spaceResult.isError) {
                length += spaceResult.value.length;
            }

            index++;
        }

        if (values.length < (atLeast ??= 0 as L)) {
            return {
                isError: true,
                error: context.translate(readerTerms).atLeastNItemsExpected({ count: atLeast }),
            };
        }

        return {
            isError: false,
            value: { length, parsedValue: values as TupleOf<T, L> & T[] },
        };
    };
}
