import { GuildMessage } from '../utils';
import { GuildMember } from 'discord.js';
import { Bot } from '../Bot';

import * as Arguments from './ArgumentTypes';

export class CommandContext {
    public readonly executor: GuildMember;

    #userInput: string;
    #spaceReader: Arguments.ArgumentReader<string> = Arguments.ReadSpace;

    public static readonly argumentTypes = {
        number: Arguments.ReadNumber,
        member: Arguments.ReadMember,
        role: Arguments.ReadRole,
        textChannel: Arguments.ReadTextChannel,
        remainingText: Arguments.ReadRemainingText,
    };

    public readonly read: {
        [ArgType in keyof typeof CommandContext['argumentTypes']]:
        () => typeof CommandContext['argumentTypes'][ArgType] extends Arguments.ArgumentReader<infer T> ? T : never
    };

    constructor(
        public readonly bot: Bot,
        public readonly message: GuildMessage,
        executor?: GuildMember
    ) {
        this.executor = executor || message.member;
        this.#userInput = message.content.replace(/^\S+\s*/, '');

        this.read = {} as any;
        for (const type of Object.keys(CommandContext.argumentTypes)) {
            Object.defineProperty(this.read, type, {
                get: () => () => this.readArgument(type)
            });
        }
    }

    public get endOfCommand(): boolean {
        return !this.#userInput;
    }

    private readArgument<T>(type: string): T {
        if (this.endOfCommand) {
            throw new SyntaxError(`argument of type '${type}' expected, but got end of command`);
        }

        const argumentReader = (CommandContext.argumentTypes as any)[type] as Arguments.ArgumentReader<any>;
        if (!argumentReader) {
            throw new Error(`invalid argument type '${type}'`);
        }

        let { argumentLength, parsedValue } = argumentReader(this.#userInput, this.message);
        if (argumentLength <= 0) {
            let errorMessage = `argument of type '${type}' expected`;

            const gotWord = this.#userInput.match(/^\S+/);
            if (gotWord && gotWord[0]) {
                errorMessage += `, but got '${gotWord[0]}'`;
            }

            throw new SyntaxError(errorMessage);
        }

        this.#userInput = this.#userInput.slice(argumentLength);

        const spaceLength = this.#spaceReader(this.#userInput, undefined as any).argumentLength
        this.#userInput = this.#userInput.slice(spaceLength);

        return parsedValue;
    }
}
