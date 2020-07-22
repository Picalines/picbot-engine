import { Guild, GuildMember } from "discord.js";
import { EventEmitter } from "events";
import { GuildData } from "./Guild";
import { Bot } from "../Bot";

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
export class BotDatabase extends EventEmitter implements Iterable<GuildData> {
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
     * Добавляет в базу данных бота новый сервер
     * @param guild сервер
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
     */
    public getGuildData(guild: Guild): GuildData {
        return this.#guilds.get(guild.id) ?? (this.createGuildData(guild) as GuildData);
    }

    /**
     * Удаляет данные сервера из базы данных
     * @param guild сервер
     * @returns true, если сервер был в базе данных до удаления
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
     * Вызывает событие `loadGuild` для каждого сервера бота
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
     * Вызывает событие `saveGuild` для каждого сервера бота
     */
    public save(): void {
        this.emit('beforeSave');
        this.#guilds.forEach(guildData => {
            this.emit('saveGuild', guildData);
        });
        this.emit('saved');
    }

    public [Symbol.iterator]() {
        return this.#guilds.values();
    }
}
