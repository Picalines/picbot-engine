import { GuildMember } from "discord.js";
import { Bot } from "../Bot";
import { GuildMessage } from "../utils";
import { CommandArgument } from "./Argument/Definition";
import { Command } from "./Definition";
import { spaceReader } from "./Argument/Reader";

/**
 * Контекст запущенной команды
 */
export class CommandContext<Args extends any[]> {
    /**
     * Участник сервера, который запустил команду
     */
    public readonly executor: GuildMember;

    /**
     * Объект аргументов команды (содержит данные, если у команды прописан синтаксис. Иначе undefined)
     */
    public readonly args: [...Args];

    #userInput: string;

    /**
     * @param command команда
     * @param bot ссылка на бота
     * @param message сообщение с командой
     * @param executor участник сервера, запустивший команду
     */
    constructor(
        readonly command: Command<Args>,
        readonly bot: Bot,
        readonly message: GuildMessage,
        executor?: GuildMember
    ) {
        this.executor = executor ?? message.member;

        this.#userInput = message.content.replace(/^\S+\s*/, '');

        this.args = [] as any;
        command.arguments?.forEach(argument => this.args.push(this.readUserInput(argument)));
    }

    private readUserInput<T>(argument: CommandArgument<T>): T {
        const readerResult = argument.reader(this.#userInput, this.message);
        if (readerResult.isError) {
            const error = typeof readerResult.error == 'string' ? 'not found' : readerResult.error.message;
            throw new Error(`error in argument '${argument.name}': ${error}`);
        }

        const { length: argumentLength, parsedValue } = readerResult.value;
        this.#userInput = this.#userInput.slice(argumentLength);

        const spaceReaderResult = spaceReader(this.#userInput, undefined as any);
        if (!spaceReaderResult.isError && spaceReaderResult.value.length) {
            this.#userInput = this.#userInput.slice(spaceReaderResult.value.length);
        }

        return parsedValue as T;
    }
}
