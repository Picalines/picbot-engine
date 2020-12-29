import { spaceReader } from "../argument";
import { CommandArgument } from "./Argument";
import { CommandContext } from "../Context";
import { ArgsDefinitions } from "./Reader";
import { constTerm, TermCollection } from "../../translator";
import { assert, Indexes } from "../../utils";

/**
 * Класс, хранящий объявления аргументов команды
 */
export class ArgumentSequence<Args extends unknown[]> {
    /**
     * Список объявленных аргументов
     */
    private readonly definitions: ArgsDefinitions<Args>;

    /**
     * Термины имён и описаний аргументов для переводчика
     */
    readonly terms: TermCollection<{ [I in `${Indexes<Args>}_${"name" | "description"}`]: {} }>;

    /**
     * @param definitions объявления аргументов команды
     */
    constructor(...definitions: ArgsDefinitions<Args>) {
        assert(definitions.length, 'argument definitions array is empty');

        const terms = {} as any;
        const names = new Set<string>();

        for (const [index, { name, description }] of definitions.entries()) {
            assert(name, `argument name is invalid`);

            assert(!names.has(name), `duplicate argument name '${name}'`)
            names.add(name);

            terms[`${index}_name`] = constTerm(name);
            terms[`${index}_description`] = constTerm(description ?? '');
        }

        this.definitions = [...definitions] as unknown as ArgsDefinitions<Args>;
        this.terms = new TermCollection(terms);
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
