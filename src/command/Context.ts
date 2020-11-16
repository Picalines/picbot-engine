import { GuildMember } from "discord.js";
import { Bot } from "../Bot";
import { spaceReader } from "../builtIn/reader/String";
import { GuildMessage } from "../utils";
import { CommandArgument } from "./Argument/Definition";
import { Command } from "./Definition";

/**
 * Контекст выполнения запущенной
 */
export class CommandContext<Args extends any[]> {
    /**
     * Участник сервера, который запустил команду
     */
    public readonly executor: GuildMember;

    /**
     * Объект аргументов команды (содержит данные, если у команды прописан синтаксис. Иначе undefined)
     */
    public readonly args: Args;

    /**
     * @param command команда
     * @param bot ссылка на бота
     * @param message сообщение с командой
     */
    constructor(
        readonly command: Command<Args>,
        readonly bot: Bot,
        readonly message: GuildMessage,
    ) {
        this.executor = message.member;

        if (command.arguments) {
            const userInput = message.content.replace(/^\S+\s*/, '');
            this.args = command.arguments.readArguments(userInput, this as unknown as CommandContext<unknown[]>);
        }
        else {
            this.args = [] as any;
        }
    }
}
