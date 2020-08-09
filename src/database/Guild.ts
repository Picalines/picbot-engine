import { Guild, UserResolvable } from "discord.js";
import { Bot } from "../Bot";
import { PrefixStorage } from "../PrefixStorage";
import { BotDatabase } from "./Bot";
import { GuildMemberData } from "./Member";

/**
 * Класс базы данных сервера
 */
export class GuildData {
    #members = new Map<string, GuildMemberData>();

    /**
     * Префиксы бота на сервере
     */
    public readonly prefixes = new PrefixStorage();

    constructor(
        /**
         * Ссылка на базу данных
         */
        public readonly database: BotDatabase,
        /**
         * Сервер
         */
        public readonly guild: Guild,
    ) {
        this.prefixes.list = database.bot.options.guild.defaultPrefixes as any;
    }

    /**
     * Ссылка на бота
     */
    get bot(): Bot {
        return this.database.bot;
    }

    /**
     * Генератор, возвращающий всех участников сервера, которые есть в базе данных
     */
    get members(): IterableIterator<GuildMemberData> {
        return this.#members.values();
    }

    /**
     * @returns данные учатсника сервера
     * @param memberResolveable участник сервера (его id / user)
     */
    getMemberData(memberResolveable: UserResolvable): GuildMemberData {
        const member = this.guild.member(memberResolveable);
        if (!member) {
            throw new Error(`unknown member ${memberResolveable}`);
        }
        if (member.user.bot && this.bot.options.database.ignoreBots) {
            throw new Error(`storing bot member data is not allowed in options`);
        }
        let memberData = this.#members.get(member.id);
        if (!memberData) {
            memberData = new GuildMemberData(this, member);
            this.#members.set(member.id, memberData);
        }
        return memberData;
    }

    /**
     * Удаляет данные участника сервера из базы данных
     * @param memberResolveable участник сервера (его id / user)
     * @returns true, если данные успешно удалены
     */
    deleteMemberData(memberResolveable: UserResolvable): boolean {
        const member = this.guild.member(memberResolveable);
        if (!member) {
            throw new Error(`unknown member ${memberResolveable}`);
        }
        return this.#members.delete(member.id);
    }
}
