import { spaceReader } from "../argument/index.js";
import { ArgsDefinitions, CommandArgument } from "./Argument.js";
import { CommandContext } from "../Context.js";
import { assert } from "../../utils/index.js";
import { argumentReaderTerms } from "./readers/index.js";

export class ArgumentSequence<Args extends unknown[]> {
    /**
     * use context.translate to get translated info!
     */
    readonly definitions: ArgsDefinitions<Args>;

    constructor(...definitions: ArgsDefinitions<Args>) {
        assert(definitions.length, 'argument definitions array is empty');
        this.definitions = [...definitions] as unknown as ArgsDefinitions<Args>;
    }

    get length() {
        return this.definitions.length;
    }

    private readArgument<T>(userInput: string, argument: CommandArgument<T>, index: number, context: CommandContext<unknown[]>): [slicedInput: string, parsedValue: T] {
        const readerResult = argument.reader(userInput, context);
        if (readerResult.isError) {
            throw new Error(context.translate(argumentReaderTerms).errorInArgument({ index, error: readerResult.error }));
        }

        const { length: argumentLength, parsedValue } = readerResult.value;
        userInput = userInput.slice(argumentLength);

        const spaceReaderResult = spaceReader(userInput, context);
        if (!spaceReaderResult.isError && spaceReaderResult.value.length) {
            userInput = userInput.slice(spaceReaderResult.value.length);
        }

        return [userInput, parsedValue as T];
    }

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
