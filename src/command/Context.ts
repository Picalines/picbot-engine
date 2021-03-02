import { GuildMessage } from "../utils/index.js";
import { Command } from "./Command.js";
import { Bot } from "../bot/index.js";
import { TermCollection, TermsDefinition, TranslationCollection } from "../translator/index.js";

export class CommandContext<Args extends unknown[]> {
    readonly args: Args;

    readonly translate: <Contexts extends TermsDefinition>(terms: TermCollection<Contexts>) => TranslationCollection<Contexts>['translations'];

    constructor(
        readonly command: Command<Args>,
        readonly bot: Bot,
        readonly message: GuildMessage,
        readonly locale: string,
    ) {
        this.translate = terms => this.bot.translator.translations(terms, this.locale);

        if (this.command.arguments) {
            const userInput = message.content.replace(/^\S+\s*/, '');
            this.args = this.command.arguments.read(userInput, this as unknown as CommandContext<unknown[]>);
        }
        else {
            this.args = [] as any;
        }
    }

    get executor() {
        return this.message.member;
    }

    get database() {
        return this.bot.database;
    }

    get logger() {
        return this.bot.logger;
    }
}
