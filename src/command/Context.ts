import { GuildMember } from "discord.js";
import { Bot } from "../Bot";
import { GuildMessage } from "../utils";
import { ArgumentReader, ReadSpace } from "./argument/Readers";
import { ArgumentReaderStorage } from "./argument/Storage";
import { CommandInfo } from "./Info";

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
     * Регулярное выражение аргумента в синтаксисе команды
     */
    public static readonly syntaxArgumentRegex = /<(?<type>\w+):(?<name>\w+)(?:=(?<default>.*?))?>/g;

    /**
     * Регулярное выражение синтаксиса команды (используется для валидации)
     */
    public static readonly commandSyntaxRegex = /(<\w+:\w+(?:=.*)?>\s*)+/;

    /**
     * Объект аргументов команды (содержит данные, если у команды прописан синтаксис. Иначе undefined)
     */
    public readonly args: any;

    /**
     * Возвращает true, если в сообщении больше нет аргументов
     */
    public readonly isEOL: () => boolean;

    /**
     * @param command команда
     * @param bot ссылка на бота
     * @param message сообщение с командой
     * @param executor участник сервера, запустивший команду
     */
    constructor(
        command: CommandInfo,
        public readonly bot: Bot,
        public readonly message: GuildMessage,
        executor?: GuildMember
    ) {
        this.executor = executor || message.member;

        this.#userInput = message.content.replace(/^\S+\s*/, '');
        this.isEOL = () => !this.#userInput;

        this.read = {} as any;
        const { readers } = bot.commandArguments;
        for (const [type, reader] of Object.entries(readers)) {
            Object.defineProperty(this.read, type, {
                get: () => () => this.readUserInput(reader, type)
            });
        }

        this.args = undefined;
        if (command.arguments !== undefined) {
            this.args = {};
            for (const argData of command.arguments) {
                try {
                    this.args[argData.name] = this.readUserInput(readers[argData.type], argData.type);
                }
                catch (err) {
                    if (!(err instanceof Error)) throw err;
                    if (!this.isEOL()) throw err;
                    if (!argData.readDefault) throw err;
                    try {
                        this.args[argData.name] = argData.readDefault(this);
                    }
                    catch (defaultErr) {
                        if (!(defaultErr instanceof Error)) throw defaultErr;
                        throw new Error(`error in default argument '${argData.name}' value: ${defaultErr.message}`);
                    }
                }
            }
        }
    }

    private readUserInput<T>(reader: ArgumentReader<T>, typeName: string): T {
        if (this.isEOL()) {
            throw new Error(`argument of type '${typeName}' expected, but got end of command`);
        }

        let readerResult = reader(this.#userInput, this.message);
        if (readerResult.isError) {
            throw new Error(`argument of type '${typeName}' expected (${readerResult.error})`);
        }

        const { length: argumentLength, parsedValue } = readerResult.value;
        this.#userInput = this.#userInput.slice(argumentLength);

        const spaceReaderResult = this.#spaceReader(this.#userInput, undefined as any);
        if (!spaceReaderResult.isError && spaceReaderResult.value.length) {
            this.#userInput = this.#userInput.slice(spaceReaderResult.value.length);
        }

        return parsedValue as T;
    }
}
