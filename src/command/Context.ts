import { GuildMessage } from "../utils";
import { Command } from "./Command";
import { Bot } from "../bot";
import { TermCollection, TermContexts, TranslationCollection } from "../translator";

/**
 * Контекст выполнения запущенной команды
 */
export class CommandContext<Args extends unknown[]> {
    /**
     * Объект аргументов команды (содержит данные, если у команды прописан синтаксис. Иначе undefined)
     */
    readonly args: Args;

    /**
     * @returns переводчик коллекции терминов (учитывает локаль сервера)
     * @param terms коллекция терминов
     * @param defaultLocale локаль, которую нужно использовать, если для локали сервера нет нужного перевода
     */
    readonly translator: <Contexts extends TermContexts>(terms: TermCollection<Contexts>) => TranslationCollection<Contexts>['get'];

    /**
     * @param command команда
     * @param bot ссылка на бота
     * @param message сообщение с командой
     * @param locale локаль сервера, полученная из [[BotOptions.fetchLocale]]
     */
    constructor(
        readonly command: Command<Args>,
        readonly bot: Bot,
        readonly message: GuildMessage,
        readonly locale: string,
    ) {
        this.translator = terms => this.bot.translator.get(terms, this.locale);

        if (this.command.arguments) {
            const userInput = message.content.replace(/^\S+\s*/, '');
            this.args = this.command.arguments.read(userInput, this as unknown as CommandContext<unknown[]>);
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
