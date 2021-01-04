import { spaceReader } from "../argument";
import { ArgsDefinitions, CommandArgument } from "./Argument";
import { CommandContext } from "../Context";
import { assert } from "../../utils";
import { argumentReaderTerms } from "./readers";

/**
 * Класс, хранящий объявления аргументов команды
 */
export class ArgumentSequence<Args extends unknown[]> {
    /**
     * Список объявлений аргументов
     */
    readonly definitions: ArgsDefinitions<Args>;

    /**
     * @param definitions объявления аргументов команды
     */
    constructor(...definitions: ArgsDefinitions<Args>) {
        assert(definitions.length, 'argument definitions array is empty');
        this.definitions = [...definitions] as unknown as ArgsDefinitions<Args>;
    }

    /**
     * Кол-во аргументов в последовательности
     */
    get length() {
        return this.definitions.length;
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
            throw new Error(context.translate(argumentReaderTerms).errorInArgument({ index, error }));
        }

        const { length: argumentLength, parsedValue } = readerResult.value;
        userInput = userInput.slice(argumentLength);

        const spaceReaderResult = spaceReader(userInput, context);
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
    read(userInput: string, context: CommandContext<unknown[]>): Args {
        const values = [];
        for (const [index, argument] of this.definitions.entries()) {
            let value;
            [userInput, value] = this.readArgument(userInput, argument, index, context);
            values.push(value);
        }
        return values as Args;
    }
}
