import { Entity as Entity, Property as Property, WidenEntity, AnyProperty } from "./Property/Definition";
import { PropertyAccess as PropertyAccess } from "./Property/Access";
import { DatabaseValueStorage } from "./Property/Storage";
import { BotDatabaseHandler } from "./Handler";
import { Constructable, Guild, GuildMember } from "discord.js";
import { EventEmitter } from "events";
import { Bot } from "../Bot";

export declare interface BotDatabase {
    on(event: 'beforeSaving', listener: () => void): this;
    on(event: 'saved', listener: () => void): this;
    on(event: 'beforeLoading', listener: () => void): this;
    on(event: 'loaded', listener: () => void): this;
    on(event: string, listener: () => void): this;
}

/**
 * Класс базы данных бота
 */
export class BotDatabase extends EventEmitter {
    #properties: Map<string, AnyProperty>
    #guildProperties: DatabaseValueStorage<'guild'>;
    #memberProperties: Map<string, DatabaseValueStorage<'member'>>;

    constructor(
        public readonly bot: Bot,
        public readonly handler: BotDatabaseHandler,
    ) {
        super();

        this.#guildProperties = new this.handler.guildPropertyStorageClass();
        this.#properties = new Map();
        this.#memberProperties = new Map();

        this.on('loaded', async () => await this.handler.onLoaded?.(this));
        this.on('saved', async () => await this.handler.onSaved?.(this));

        bot.client.on('guildDelete', async guild => {
            const memberStorage = this.#memberProperties.get(guild.id);
            await memberStorage?.cleanup();
            await this.#guildProperties.cleanupEntity(guild);
            await this.handler.onGuildDelete?.(this, guild);
            this.#memberProperties.delete(guild.id)
        });

        bot.client.on('guildMemberRemove', async member => {
            const memberStorage = this.#memberProperties.get(member.guild.id);
            if (memberStorage) {
                member = member.partial ? await member.fetch() : member;
                await memberStorage?.cleanupEntity(member);
            }
        });
    }

    /**
     * Добавляет свойство сущности в память бота
     * @param property объявление свойства
     * @returns true, если свойство успешно добавлено
     */
    public defineProperty(property: AnyProperty): boolean {
        if (this.#properties.has(property.key)) {
            return false;
        }

        this.#properties.set(property.key, property);
        return true;
    }

    /**
     * @returns объявление свойства, которое 'помнит' база данных
     * @param key ключ свойства
     */
    public definedProperty<E extends Entity>(key: string): AnyProperty<E> | undefined {
        return this.#properties.get(key) as any;
    }

    /**
     * @returns список объявлений свойст, которые 'помнит' база данных
     * @param entityType тип сущности
     */
    public definedProperties<E extends Entity>(entityType: E | 'any'): AnyProperty<E>[] {
        const props = [...this.#properties.values()];
        if (entityType == 'any') {
            return props as any;
        }
        return props.filter(p => p.entityType == entityType) as any;
    }

    /**
     * Возвращает объект, дающий доступ к чтению / изменению значения свойства
     * @param entity сущность (сервер / участник сервера)
     * @param property свойство сущности
     */
    public accessProperty<E extends Entity, T, A extends PropertyAccess<T>>(entity: WidenEntity<E>, property: Property<E, T, A>): A {
        this.defineProperty(property);

        type ValueStorage = DatabaseValueStorage<E>;
        let storage: ValueStorage | undefined = undefined;

        if ((entity as GuildMember).guild) {
            storage = this.#memberProperties.get((entity as GuildMember).guild.id) as ValueStorage | undefined;
        }
        else {
            storage = this.#guildProperties as ValueStorage;
        }

        const constructor = (property.accessorClass ?? PropertyAccess) as Constructable<A>;

        return new constructor(property, {
            set: async (value: T) => {
                if (!property.validate(value)) {
                    throw new Error(`value '${value}' is not valid for database property '${property.key}'`);
                }

                if (!storage) {
                    storage = new this.handler.memberPropertyStorageClass() as ValueStorage;
                    this.#memberProperties.set((entity as GuildMember).guild.id, storage as DatabaseValueStorage<'member'>);
                }

                await storage.storeValue(entity, property.key, value);
            },

            reset: async () => await storage?.deleteValue(entity, property.key) ?? false,

            rawValue: async () => await storage?.restoreValue(entity, property.key),

            value: async function () {
                return await this.rawValue() ?? property.defaultValue;
            },
        });
    }

    /**
     * Загружает базу данных
     * @emits beforeLoading
     * @emits loaded
     */
    public async load(): Promise<void> {
        console.log(`loading ${this.bot.username}'s database...`);

        this.emit('beforeLoading');

        if (this.handler.prepareForLoading) {
            console.log('* preparing...');
            await this.handler.prepareForLoading(this);
            console.log('- prepared successfully');
        }

        if (this.handler.loadGuild) {
            console.log('* loading guilds...');

            const guildsToLoad = this.bot.client.guilds.cache.map(g => g.id);

            const getLoadingPromise = async (id: string) => {
                const guild = await this.bot.client.guilds.fetch(id, true);
                await this.handler.loadGuild!(this, guild);
                return guild;
            };

            for await (const guild of guildsToLoad.map(getLoadingPromise)) {
                console.log(`- guild '${guild.name}' successfully loaded`);
            }

            console.log('- guilds successfully loaded')
        }

        console.log(`${this.bot.username}'s database successfully loaded`);

        this.emit('loaded');
    }

    /**
     * Сохраняет базу данных
     * @emits beforeSaving
     * @emits saved
     */
    public async save(): Promise<void> {
        console.log(`saving ${this.bot.username}'s database...`);

        this.emit('beforeSaving');

        if (this.handler.prepareForSaving) {
            console.log('* preparing...');
            await this.handler.prepareForSaving(this);
            console.log('- prepared successfully');
        }

        if (this.handler.saveGuild) {
            console.log('* saving guilds...');

            const { cache: guildsToSave } = this.bot.client.guilds;

            const getSavingPromise = async (guild: Guild) => {
                await this.handler.saveGuild!(this, guild);
                return guild;
            }

            for await (const guild of guildsToSave.map(getSavingPromise)) {
                console.log(`- guild '${guild.name}' successfully saved`);
            }

            console.log('- guilds successfully saved');
        }

        console.log(`${this.bot.username}'s database successfully saved`);

        this.emit('saved');
    }
}
