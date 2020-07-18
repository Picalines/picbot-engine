import { ArgumentReader, ReadSpace } from './argument/Readers';
import { ArgumentReaderStorage } from './argument/Storage';
import { GuildMessage } from '../utils';
import { GuildMember } from 'discord.js';
import { Bot } from '../Bot';

/**
 * Контекст запущенной команды
 */
export class CommandContext {
    /**
     * Участник сервера, который запустил команду
     */
    public readonly executor: GuildMember;

    #userInput: string;
    #spaceReader: ArgumentReader<string> = ReadSpace;

    /**
     * Объект, содержащий функции чтения аргументов.
     * Зависит от хранилища типов аргументов бота.
     */
    public readonly read: {
        [ArgType in keyof ArgumentReaderStorage['readers']]: () =>
        ArgumentReaderStorage['readers'][ArgType] extends ArgumentReader<infer T> ? T : never
    };

    /**
     * Возвращает true, если в сообщении больше нет аргументов
     */
    public readonly isEOL: () => boolean;

    /**
     * @param bot ссылка на бота
     * @param message сообщение с командой
     * @param executor участник сервера, запустивший команду
     */
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
            throw new Error(`argument of type '${typeName}' expected, but got end of command`);
        }

        let readerResult = reader(this.#userInput, this.message);
        if (readerResult.isError) {
            let errorMessage = `argument of type '${typeName}' expected`;

            const gotWord = this.#userInput.match(/^\S+/);
            if (gotWord && gotWord[0]) {
                errorMessage += `, but got '${gotWord[0]}'`;
            }

            throw new Error(errorMessage);
        }

        const { length: argumentLength, parsedValue } = readerResult.value;
        this.#userInput = this.#userInput.slice(argumentLength);

        const spaceReaderResult = this.#spaceReader(this.#userInput, undefined as any);
        if (!spaceReaderResult.isError && spaceReaderResult.value.length) {
            this.#userInput = this.#userInput.slice(spaceReaderResult.value.length);
        }

        return parsedValue as T;
    }
    
    private readSyntax(syntax: string): any {
        const argDefs = syntax.replace(/\s{2,}/, ' ').split(' ');
        
        type ArgData = { name: string; reader: ArgumentReader<T> };
        const args: ArgData[] = [];
        
        const dataRegex = /(?<type>\w+):(?<name>\w+)/;
        const typeRegex = /(<(?<data>.+)>)|(\[(?<data>.+)\])/;
        for (const def of argDefs) {
            // TODO
        }
    }
}
