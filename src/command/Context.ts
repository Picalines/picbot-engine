import { ArgumentReader, ReadSpace } from './argument/Readers';
import { ArgumentReaderStorage } from './argument/Storage';
import { GuildMessage } from '../utils';
import { GuildMember } from 'discord.js';
import { Bot } from '../Bot';

export class CommandContext {
    public readonly executor: GuildMember;

    #userInput: string;
    #spaceReader: ArgumentReader<string> = ReadSpace;

    public readonly read: {
        [ArgType in keyof ArgumentReaderStorage['readers']]: () =>
        ArgumentReaderStorage['readers'][ArgType] extends ArgumentReader<infer T> ? T : never
    };

    public readonly isEOL: () => boolean;

    constructor(
        public readonly bot: Bot,
        public readonly message: GuildMessage,
        executor?: GuildMember
    ) {
        this.executor = executor || message.member;

        this.#userInput = message.content.replace(/^\S+\s*/, '');
        this.isEOL = () => !this.#userInput;

        this.read = {} as any;
        for (const [type, reader] of Object.entries(bot.commandArguments.readers)) {
            Object.defineProperty(this.read, type, {
                get: () => () => this.readArgument(reader, type)
            });
        }
    }

    private readArgument<T>(reader: ArgumentReader<T>, typeName: string): T {
        if (this.isEOL()) {
            throw new SyntaxError(`argument of type '${typeName}' expected, but got end of command`);
        }

        let { argumentLength, parsedValue } = reader(this.#userInput, this.message);
        if (argumentLength <= 0) {
            let errorMessage = `argument of type '${typeName}' expected`;

            const gotWord = this.#userInput.match(/^\S+/);
            if (gotWord && gotWord[0]) {
                errorMessage += `, but got '${gotWord[0]}'`;
            }

            throw new SyntaxError(errorMessage);
        }

        this.#userInput = this.#userInput.slice(argumentLength);

        const spaceLength = this.#spaceReader(this.#userInput, undefined as any).argumentLength
        this.#userInput = this.#userInput.slice(spaceLength);

        return parsedValue as T;
    }
}
