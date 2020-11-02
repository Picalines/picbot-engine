import { ArgumentReader } from "../../command/Argument/Reader";
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
