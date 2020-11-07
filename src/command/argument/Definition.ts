import { spaceReader } from "../../builtIn/reader/String";
import { InferPrimitive } from "../../utils";
import { CommandContext } from "../Context";
import { ArgumentReader } from "./Reader";

/**
 * Интерфейс аргумента комманды
 */
export interface CommandArgument<T> {
    /**
     * Имя аргумента команды
     */
    readonly name: string;

    /**
     * Описание аргумента
     */
    readonly description: string;

    /**
     * @returns функцию, читающаю аргумент
     */
    readonly reader: ArgumentReader<InferPrimitive<T>>;
}

type ArgsArray<Args extends any[]> = readonly [...{
    [K in keyof Args]: CommandArgument<Args[K]>
}];

/**
 * Класс, хранящий объявления аргументов команды
 */
export class CommandArguments<Args extends any[]> implements Iterable<ArgsArray<Args>[number]> {
    /**
     * Список объявленных аргументов
     */
    readonly definitons: ArgsArray<Args>;

    /**
     * @param definitions объявления аргументов команды
     */
    constructor(...definitions: ArgsArray<Args>) {
        if (!definitions.length) {
            throw new Error('argument definitions array is empty');
        }

        const names = definitions.map(d => d.name);
        for (const [index, name] of names.entries()) {
            if (!CommandArguments.validateArgumentName(name)) {
                throw new Error(`command argument name '${name}' is invalid`);
            }
            if (names.some((n, i) => name == n && index != i)) {
                throw new Error(`duplicate command argument name '${name}'`)
            }
        }

        this.definitons = [...definitions];
    }

    *[Symbol.iterator]() {
        yield* this.definitons;
    }

    /**
     * Проверяет имя аргумента
     * @param name имя аргумента
     * @returns true, если name не пустрая строка и не содержит пробелов
     */
    static validateArgumentName(name: string) {
        return name.length > 0 && !name.includes(' ');
    }

    /**
     * Читает аргумент в строке ввода пользователя
     * @param userInput строка ввода пользователя
     * @param argument аргумент команды
     * @param context контекст команды
     */
    readUserInput<T>(userInput: string, argument: CommandArgument<T>, context: CommandContext<Args>): [slicedInput: string, parsedValue: T] {
        const readerResult = argument.reader(userInput, context as unknown as CommandContext<unknown[]>);
        if (readerResult.isError) {
            const error = readerResult.error ?? 'not found';
            throw new Error(`error in argument '${argument.name}': ${error}`);
        }

        const { length: argumentLength, parsedValue } = readerResult.value;
        userInput = userInput.slice(argumentLength);

        const spaceReaderResult = spaceReader(userInput, undefined as any);
        if (!spaceReaderResult.isError && spaceReaderResult.value.length) {
            userInput = userInput.slice(spaceReaderResult.value.length);
        }

        return [userInput, parsedValue as T];
    }

    /**
     * Читает аргументы в строке ввода пользователя
     * @param userInput строка ввода пользователя
     * @param context контекст команды
     */
    readValues(userInput: string, context: CommandContext<Args>): Args {
        const values = [];
        for (const argument of this) {
            let value;
            [ userInput, value ] = this.readUserInput(userInput, argument, context);
            values.push(value);
        }
        return values as Args;
    }
}
