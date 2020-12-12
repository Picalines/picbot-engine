import { spaceReader } from "../../builtIn";
import { CommandArgument } from "./Argument";
import { CommandContext } from "../Context";
import { ArgsDefinitions, CommandArgumentsReader } from "./Reader";

/**
 * Класс, хранящий объявления аргументов команды
 */
export class ArgumentSequence<Args extends unknown[]> implements CommandArgumentsReader<Args> {
    /**
     * Список объявленных аргументов
     */
    readonly definitions: ArgsDefinitions<Args>;

    /**
     * @param definitions объявления аргументов команды
     */
    constructor(...definitions: ArgsDefinitions<Args>) {
        if (!definitions.length) {
            throw new Error('argument definitions array is empty');
        }

        const names = definitions.map(d => d.name);
        for (const [index, name] of names.entries()) {
            if (!ArgumentSequence.validateArgumentName(name)) {
                throw new Error(`command argument name '${name}' is invalid`);
            }
            if (names.some((n, i) => name == n && index != i)) {
                throw new Error(`duplicate command argument name '${name}'`);
            }
        }

        this.definitions = [...definitions];
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
    private readArgument<T>(userInput: string, argument: CommandArgument<T>, index: number, context: CommandContext<unknown[]>): [slicedInput: string, parsedValue: T] {
        const readerResult = argument.reader(userInput, context);
        if (readerResult.isError) {
            const error = readerResult.error ?? 'not found';
            throw new Error(`error in argument #${index + 1} '${argument.name}': ${error}`);
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
    readArguments(userInput: string, context: CommandContext<unknown[]>): Args {
        const values = [];
        for (const [index, argument] of this.definitions.entries()) {
            let value;
            [userInput, value] = this.readArgument(userInput, argument, index, context);
            values.push(value);
        }
        return values as Args;
    }
}
