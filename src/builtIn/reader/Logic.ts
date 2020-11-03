import { ArgumentReader, ArgumentReaderError, spaceReader } from "../../command/Argument/Reader";
import { InferPrimitive } from "../../utils";

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

const innerError = (error: ArgumentReaderError, inElement: string): ReturnType<ArgumentReader<any>> => {
    const errorMsg = error == 'notFound' ? 'not found' : error.message;
    return { isError: true, error: { message: `error in ${inElement}: ${errorMsg}` } };
}

/**
 * Соединяет несколько функций чтения в одну
 * @param readers функции чтения
 */
export const mergeReaders = <T extends any[]>(...readers: { [K in keyof T]: ArgumentReader<T[K]> }): ArgumentReader<T> => {
    return (userInput, message) => {
        const values: T = [] as any;
        let length = 0;

        for (let i = 0; i < readers.length; i++) {
            const valResult = readers[i](userInput.slice(length), message);
            if (valResult.isError) {
                return innerError(valResult.error, `element #${i + 1}`);
            }

            values.push(valResult.value.parsedValue);
            length += valResult.value.length;

            const spaceResult = spaceReader(userInput.slice(length), message);
            if (!spaceResult.isError) {
                length += spaceResult.value.length;
            }
        }

        return { isError: false, value: { length, parsedValue: values } };
    };
}

/**
 * Использует функцию чтения аргумента конечное кол-во раз
 * @param reader функция чтения
 * @param count кол-во повторов
 */
export const repeatReader = <T>(reader: ArgumentReader<T>, count: number): ArgumentReader<T[]> => {
    const readers: ArgumentReader<T>[] = new Array(count).fill(reader);
    return mergeReaders(...readers);
}

/**
 * Использует функцию чтения до конца сообщения
 * @param reader функция чтения
 */
export const restReader = <T>(reader: ArgumentReader<T>, atLeast?: number): ArgumentReader<T[]> => {
    return (userInput, message) => {
        const values: T[] = [];
        let length = 0;

        while (length < userInput.length) {
            const valResult = reader(userInput.slice(length), message);
            if (valResult.isError) {
                return innerError(valResult.error, 'last element');
            }

            values.push(valResult.value.parsedValue);
            length += valResult.value.length;

            const spaceResult = spaceReader(userInput.slice(length), message);
            if (!spaceResult.isError) {
                length += spaceResult.value.length;
            }
        }

        if (values.length < (atLeast ??= 0)) {
            return { isError: true, error: { message: `at least ${atLeast} element(s) expected` } };
        }

        return { isError: false, value: { length, parsedValue: values } };
    };
}
