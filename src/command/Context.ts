import { GuildMember } from "discord.js";
import { Bot } from "../Bot";
import { GuildMessage } from "../utils";
import { ArgumentReader, ReadSpace } from "./argument/Readers";
import { ArgumentReaderStorage } from "./argument/Storage";
import { Command } from "./Definition";

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
        public readonly command: Command,
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

        const { arguments: commandArgs } = command.info;
        if (commandArgs === undefined) {
            this.args = undefined;
            return;
        }

        this.args = {};
        for (const { name, type, defaultInput } of commandArgs) {
            const reader = readers[type];
            try {
                this.args[name] = this.readUserInput(reader, type, name);
            }
            catch (inputErr) {
                if (!(inputErr instanceof Error)
                    || !this.isEOL()
                    || defaultInput === undefined)
                    throw inputErr;

                if (defaultInput == '') {
                    this.args[name] = undefined;
                    continue;
                }

                try {
                    const readResult = reader(defaultInput, message);
                    if (readResult.isError) throw new Error(String(readResult.error));
                    this.args[name] = readResult.value.parsedValue;
                }
                catch (defaultErr) {
                    if (!(defaultErr instanceof Error)) throw defaultErr;
                    throw new Error(`error in default argument '${name}' value: ${defaultErr.message}`);
                }
            }
        }
    }

    private readUserInput<T>(reader: ArgumentReader<T>, typeName: string, argName?: string): T {
        argName = argName ? ` '${argName}'` : '';
        if (this.isEOL()) {
            throw new Error(`argument${argName} of type '${typeName}' expected, but got end of command`);
        }

        let readerResult = reader(this.#userInput, this.message);
        if (readerResult.isError) {
            throw new Error(`argument${argName} of type '${typeName}' expected (${readerResult.error})`);
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
