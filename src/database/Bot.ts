import { Bot } from "../Bot";
import { GuildData } from "./Guild";
import { Guild, Collection, GuildMember } from "discord.js";
import { GuildMemberData } from "./Member";
import { BotDatabaseHandler } from "./Handler";

/**
 * Класс базы данных бота
 */
export class BotDatabase {
    #guilds = new Collection<string, GuildData>();

    constructor(
        public readonly bot: Bot,
        public readonly handler: BotDatabaseHandler,
    ) {
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
     * @returns undefined, если данные сервера с таким id уже были в базе данных
     */
    public async createGuildData(guild: Guild): Promise<GuildData | undefined> {
        if (this.#guilds.has(guild.id)) {
            return undefined;
        }

        const guildData = new GuildData(this, guild);
        this.#guilds.set(guild.id, guildData);

        await this.handler.onGuildCreate?.(guildData);

        return guildData;
    }

    /**
     * Возвращает данные сервера из базы данных.
     * Использует [[BotDatabase.createGuildData]], если сервера нет в базе.
     * @param guild сервер
     */
    public async getGuildData(guild: Guild): Promise<GuildData> {
        return this.#guilds.get(guild.id) ?? (await this.createGuildData(guild)) as GuildData;
    }

    /**
     * Ссылка на функцию [[GuildData.getMemberData]]
     * @param member участник сервера
     * @event guildCreate (если сервера не было в базе данных)
     */
    public async getMemberData(member: GuildMember): Promise<GuildMemberData> {
        return (await this.getGuildData(member.guild)).getMemberData(member);
    }

    /**
     * Удаляет данные сервера из базы данных
     * @param guild сервер
     * @returns true, если данные сервера были успешно удалены из базы данных
     */
    public async deleteGuildData(guild: Guild): Promise<boolean> {
        const guildData = this.#guilds.get(guild.id);
        if (!guildData) {
            return false;
        }

        await this.handler.onGuildDelete?.(guildData);

        return this.#guilds.delete(guild.id);
    }

    /**
     * Загружает данные базы данных
     */
    public async load(): Promise<void> {
        console.log(`loading ${this.bot.username}'s database...`);
        await this.handler.beforeLoad?.(this);

        const guildsToLoad = this.bot.client.guilds.cache.filter(({ id }) => !this.#guilds.has(id));

        const getLoadingPromise = async (guild: Guild) => {
            const guildData = new GuildData(this, guild);
            this.#guilds.set(guild.id, guildData);
            await this.handler.loadGuild(guildData);
            return guild;
        };

        for await (const guild of guildsToLoad.map(getLoadingPromise)) {
            console.log(`* guild '${guild.name}' successfully loaded`);
        }

        await this.handler.loaded?.(this);
        console.log(`${this.bot.username}'s database successfully loaded`);
    }

    /**
     * @event saveGuild для каждого сервера бота
     */
    public async save(): Promise<void> {
        console.log(`saving ${this.bot.username}'s database...`);
        await this.handler.beforeSave?.(this);

        const getSavingPromise = async (data: GuildData) => {
            await this.handler.saveGuild(data);
            return data.guild;
        }

        for await (const guild of this.#guilds.map(getSavingPromise)) {
            console.log(`* guild '${guild.name}' successfully saved`);
        }

        await this.handler.saved?.(this);
        console.log(`${this.bot.username}'s database successfully saved`);
    }
}
