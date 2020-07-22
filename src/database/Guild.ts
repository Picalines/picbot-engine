import { Guild, UserResolvable } from "discord.js";
import { PrefixStorage } from "../PrefixStorage";
import { GuildMemberData } from "./Member";
import { BotDatabase } from "./Bot";
import { Bot } from "../Bot";

/**
 * Класс базы данных сервера
 */
export class GuildData {
    #members = new Map<string, GuildMemberData>();

    public readonly prefixes: PrefixStorage;

    constructor(
        public readonly database: BotDatabase,
        public readonly guild: Guild,
    ) {
        this.prefixes = new PrefixStorage(database.defaultGuildPrefixes);
    }

    get bot(): Bot {
        return this.database.bot;
    }

    get members(): IterableIterator<GuildMemberData> {
        return this.#members.values();
    }

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

    deleteMemberData(memberResolveable: UserResolvable): boolean {
        const member = this.guild.member(memberResolveable);
        if (!member) {
            throw new Error(`unknown member ${memberResolveable}`);
        }
        return this.#members.delete(member.id);
    }
}
