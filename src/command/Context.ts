import { GuildMessage } from "../utils";
import { Command } from "./Command";
import { Bot } from "../Bot";

/**
 * Контекст выполнения запущенной команды
 */
export class CommandContext<Args extends unknown[]> {
    /**
     * Объект аргументов команды (содержит данные, если у команды прописан синтаксис. Иначе undefined)
     */
    readonly args: Args;

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
        if (this.command.arguments) {
            const userInput = message.content.replace(/^\S+\s*/, '');
            this.args = this.command.arguments.readArguments(userInput, this as unknown as CommandContext<unknown[]>);
        }
        else {
            this.args = [] as any;
        }
    }

    /**
     * Участник сервера, который запустил команду
     */
    get executor() {
        return this.message.member;
    }

    /**
     * Ссылка на базу данных бота
     */
    get database() {
        return this.bot.database;
    }

    /**
     * Ссылка на логгер бота
     */
    get logger() {
        return this.bot.logger;
    }
}
