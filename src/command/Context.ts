import { GuildMessage } from '../utils';
import { GuildMember } from 'discord.js';
import { Bot } from '../Bot';

import * as Arguments from '../argument';

export type ArgumentHandler<T> = {
    reader: Arguments.ArgumentReader,
    parser: Arguments.ArgumentParser<T>,
}

export type ArgumentType = 'number' | 'member' | 'role' | 'textChannel' | 'remainingText';

export class CommandContext {
    public readonly executor: GuildMember;

    #userInput: string;
    #spaceReader: Arguments.SpaceReader;

    public readonly argumentTypes = {
        number: {
            reader: new Arguments.NumberReader(),
            parser: new Arguments.NumberParser(),
        },
        member: {
            reader: new Arguments.MemberMentionReader(),
            parser: new Arguments.MemberMentionParser(),
        },
        role: {
            reader: new Arguments.RoleMentionReader(),
            parser: new Arguments.RoleMentionParser(),
        },
        textChannel: {
            reader: new Arguments.TextChannelMentionReader(),
            parser: new Arguments.TextChannelMentionParser(),
        },
        remainingText: {
            reader: new Arguments.RemainingTextReader(),
            parser: new Arguments.RamainingTextParser(),
        },
    };

    constructor(
        public readonly bot: Bot,
        public readonly message: GuildMessage,
        executor?: GuildMember
    ) {
        this.executor = executor || message.member;
        this.#userInput = message.content.replace(/^\S+\s*/, '');
        this.#spaceReader = new Arguments.SpaceReader();
    }

    public get endOfInput(): boolean {
        return !this.#userInput;
    }

    public read<ArgType extends ArgumentType>(type: ArgType)
    : CommandContext['argumentTypes'][ArgType]['parser'] extends Arguments.ArgumentParser<infer T> ? T : never {
        if (this.endOfInput) {
            throw new SyntaxError(`argument of type '${type}' expected, but got end of command`);
        }

        const argumentHandler = this.argumentTypes[type];
        if (!argumentHandler) {
            throw new Error(`invalid argument type '${type}'`);
        }

        let argLength = argumentHandler.reader.read(this.#userInput);
        if (argLength <= 0) {
            let errorMessage = `argument of type '${type}' expected`;

            const gotWord = this.#userInput.match(/^\S+/);
            if (gotWord && gotWord[0]) {
                errorMessage += `, but got '${gotWord[0]}'`;
            }

            throw new SyntaxError(errorMessage);
        }

        const argumentString = this.#userInput.slice(0, argLength);

        const value = (argumentHandler.parser as Arguments.ArgumentParser<any>)
            .parse(argumentString, this.message);

        this.#userInput = this.#userInput.slice(argLength);
        this.#userInput = this.#userInput.slice(this.#spaceReader.read(this.#userInput));

        return value;
    }
}
