import { PrefixStorage } from "../PrefixStorage";
import { BotDatabase } from "./Bot";
import { Guild } from "discord.js";
import { Bot } from "../Bot";

/**
 * Класс базы данных сервера
 */
export class GuildData {
    public readonly prefixes: PrefixStorage;

    constructor(
        public readonly botDatabase: BotDatabase,
        public readonly guild: Guild,
    ) {
        this.prefixes = new PrefixStorage(botDatabase.defaultGuildPrefixes);
    }

    get bot(): Bot {
        return this.botDatabase.bot;
    }
}
