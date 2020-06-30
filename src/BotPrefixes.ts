import { PrefixStorage } from './PrefixStorage';
import { GuildMessage } from './utils';
import { Guild } from 'discord.js';
import { Bot } from './Bot';

export class BotPrefixes {
    /**
     * Хранилище глобальных префиксов.
     * Глобальные префиксы команд доступны на всех серверах
     * @default PrefixStorage(['!'])
     */
    public readonly global = new PrefixStorage(['!']);

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
    public guild({ id }: Guild, create: boolean = false): PrefixStorage {
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

    private *getPrefixesToCheck(message: GuildMessage): IterableIterator<string> {
        const seen: Record<string, true> = {};
        for (const prefix of this.guild(message.guild)) {
            yield prefix;
            seen[prefix] = true;
        }
        for (const prefix of this.global) {
            if (!seen[prefix]) {
                yield prefix;
            }
        }
    }

    public getMessagePrefixLength(message: GuildMessage): number {
        const msgLower = message.content.toLowerCase();
        for (const prefix of this.getPrefixesToCheck(message)) {
            if (msgLower.startsWith(prefix)) {
                return prefix.length;
            }
        }
        return 0;
    }
}
