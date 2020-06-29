import { PrefixStorage } from './PrefixStorage';
import { GuildMessage } from './utils';
import { Guild } from 'discord.js';
import { Bot } from './Bot';

export class BotPrefixes {
    /**
     * Хранилище глобальных префиксов.
     * Глобальные префиксы команд доступны на всех серверах
     */
    public readonly global = new PrefixStorage();

    /**
     * Стандартные префиксы для новых серверов
     */
    public readonly defaultGuild = new PrefixStorage(['!']);

    #guildPrefixes = new Map<string, PrefixStorage>();

    constructor(bot: Bot) {
        bot.client.on('guildCreate', ({ id }) => {
            this.#guildPrefixes.set(id, new PrefixStorage(this.defaultGuild));
        });

        bot.client.on('guildDelete', ({ id }) => {
            this.#guildPrefixes.delete(id);
        });

        bot.client.on('ready', () => {
            for (const { id } of bot.client.guilds.cache.values()) {
                this.#guildPrefixes.set(id, new PrefixStorage(this.defaultGuild));
            }
        });
    }

    /**
     * @param guild сервер
     * @param create создать ли хранилище, если его нет
     * @returns хранилище префиксов сервера
     */
    public guild(guild: Guild, create: boolean = false): PrefixStorage {
        const { id } = guild;
        let storage = this.#guildPrefixes.get(id);
        if (!storage) {
            if (create) {
                storage = new PrefixStorage(this.defaultGuild);
                this.#guildPrefixes.set(id, storage);
            }
            throw new Error(`unknown guild with id '${id}'`);
        }
        return storage;
    }

    public getMessagePrefixLength(message: GuildMessage): number {
        const msgLower = message.content.toLowerCase();
        const prefixes = this.global.list.concat(this.guild(message.guild).list);
        for (const prefix of prefixes) {
            if (msgLower.startsWith(prefix)) {
                return prefix.length;
            }
        }
        return 0;
    }
}
