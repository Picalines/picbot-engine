import { Guild, GuildMember } from "discord.js";
import { EventEmitter } from "events";
import { Bot } from "../Bot";
import { GuildData } from "./Guild";
import { GuildMemberData } from "./Member";

export type GuildID = Guild['id'];
export type MemberID = GuildMember['id'];

export declare interface BotDatabase {
    on(event: 'guildCreate', listener: (data: GuildData) => void): this;
    on(event: 'guildDelete', listener: (data: GuildData) => void): this;

    on(event: 'beforeLoad', listener: Function): this;
    on(event: 'loadGuild', listener: (guild: Guild) => void): this;
    on(event: 'loaded', listener: Function): this;

    on(event: 'beforeSave', listener: Function): this;
    on(event: 'saveGuild', listener: (data: GuildData) => void): this;
    on(event: 'saved', listener: Function): this;

    on(event: string, listener: Function): this;
}

/**
 * Класс базы данных бота
 */
export class BotDatabase extends EventEmitter {
    #guilds = new Map<GuildID, GuildData>();

    constructor(
        public readonly bot: Bot,
        public readonly defaultGuildPrefixes: Readonly<string[]> = ['!'],
    ) {
        super();

        bot.client.on('guildCreate', guild => {
            this.createGuildData(guild);
        });

        bot.client.on('guildDelete', guild => {
            this.deleteGuildData(guild);
        });
    }

    /**
     * Генератор, возвращающий все сервера в базе данных
     */
    get guilds(): IterableIterator<GuildData> {
        return this.#guilds.values();
    }

    /**
     * Добавляет в базу данных бота новый сервер
     * @param guild сервер
     * @event guildCreate
     */
    public createGuildData(guild: Guild): GuildData | undefined {
        if (this.#guilds.has(guild.id)) {
            return undefined;
        }
        const guildDb = new GuildData(this, guild);
        this.#guilds.set(guild.id, guildDb);
        this.emit('guildCreate', guildDb);
        return guildDb;
    }

    /**
     * Возвращает данные сервера из базы данных.
     * Использует [[BotDatabase.createGuildData]], если сервера нет в базе.
     * @param guild сервер
     * @event guildCreate (если сервера не было в базе данных)
     */
    public getGuildData(guild: Guild): GuildData {
        return this.#guilds.get(guild.id) ?? (this.createGuildData(guild) as GuildData);
    }

    /**
     * Ссылка на функцию [[GuildData.getMemberData]]
     * @param member участник сервера
     * @event guildCreate (если сервера не было в базе данных)
     */
    public getMemberData(member: GuildMember): GuildMemberData {
        return this.getGuildData(member.guild).getMemberData(member);
    }

    /**
     * Удаляет данные сервера из базы данных
     * @param guild сервер
     * @returns true, если сервер был в базе данных до удаления
     * @event guildDelete (если сервер был в базе данных)
     */
    public deleteGuildData(guild: Guild): boolean {
        const guildDb = this.#guilds.get(guild.id);
        if (!guildDb) {
            return false;
        }

        this.emit('guildDelete', guildDb);
        this.#guilds.delete(guild.id);

        return true;
    }

    /**
     * @event loadGuild для каждого сервера бота
     */
    public load(): void {
        this.emit('beforeLoad');
        this.bot.client.guilds.cache.forEach((guildData, id) => {
            if (!this.#guilds.has(id)) {
                this.emit('loadGuild', guildData);
            }
        });
        this.emit('loaded');
    }

    /**
     * @event saveGuild для каждого сервера бота
     */
    public save(): void {
        this.emit('beforeSave');
        this.#guilds.forEach(guildData => {
            this.emit('saveGuild', guildData);
        });
        this.emit('saved');
    }
}
