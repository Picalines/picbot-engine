import { Property, AnyProperty } from "./Property/Definition";
import { EntitySelector, EntitySelectorOptions } from "./Selector/Definition";
import { Entity, WidenEntity } from "./Entity";
import { PropertyAccess } from "./Property/Access";
import { DatabaseValueStorage } from "./Property/ValueStorage";
import { BotDatabaseHandler } from "./Handler";
import { Constructable, Guild, GuildMember } from "discord.js";
import { EventEmitter } from "events";
import { Bot } from "../Bot";
import { PropertyDefinitionStorage } from "./Property/DefinitionStorage";
import { OperatorExpressions, QueryOperators } from "./Selector/Operator";

export interface BotDatabase {
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
    /**
     * Хранит свойства, которые использовала база данных
     */
    public readonly definedProperties = new PropertyDefinitionStorage();

    #guildsStorage: DatabaseValueStorage<'guild'>;
    #memberStorages: Map<string, DatabaseValueStorage<'member'>>;

    constructor(
        public readonly bot: Bot,
        public readonly handler: BotDatabaseHandler,
    ) {
        super();

        this.#guildsStorage = new this.handler.guildPropertyStorageClass(this, 'guild');
        this.#memberStorages = new Map();

        this.on('loaded', async () => await this.handler.onLoaded?.(this));
        this.on('saved', async () => await this.handler.onSaved?.(this));

        bot.client.on('guildDelete', async guild => {
            const memberStorage = this.#memberStorages.get(guild.id);
            await memberStorage?.cleanup();
            await this.#guildsStorage.cleanupEntity(guild);
            await this.handler.onGuildDelete?.(this, guild);
            this.#memberStorages.delete(guild.id)
        });

        bot.client.on('guildMemberRemove', async member => {
            const memberStorage = this.#memberStorages.get(member.guild.id);
            if (memberStorage) {
                member = member.partial ? await member.fetch() : member;
                await memberStorage?.cleanupEntity(member);
            }
        });
    }

    /**
     * Возвращает объект, дающий доступ к чтению / изменению значения свойства
     * @param entity сущность (сервер / участник сервера)
     * @param property свойство сущности
     */
    public accessProperty<E extends Entity, T, A extends PropertyAccess<T>>(entity: WidenEntity<E>, property: Property<E, T, A>): A {
        this.definedProperties.add(property);

        type ValueStorage = DatabaseValueStorage<E>;
        let storage: ValueStorage | undefined = undefined;

        if ((entity as GuildMember).guild) {
            storage = this.#memberStorages.get((entity as GuildMember).guild.id) as ValueStorage | undefined;
        }
        else {
            storage = this.#guildsStorage as ValueStorage;
        }

        const constructor = (property.accessorClass ?? PropertyAccess) as Constructable<A>;

        return new constructor(property, {
            set: async (value: T) => {
                if (!property.validate(value)) {
                    throw new Error(`value '${value}' is not valid for database property '${property.key}'`);
                }

                if (!storage) {
                    storage = new this.handler.memberPropertyStorageClass(this, 'member') as ValueStorage;
                    this.#memberStorages.set((entity as GuildMember).guild.id, storage as DatabaseValueStorage<'member'>);
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
     * @returns список сущностей, которые база данных нашла по селектору ([[EntitySelector]])
     * @param selector селектор сущностей
     * @param options настройки селектора
     */
    public async findEntities<E extends Entity>(selector: EntitySelector<E>, options: (E extends 'member' ? { guild: Guild } : {}) & Partial<EntitySelectorOptions>): Promise<WidenEntity<E>[]> {
        const expression = selector.expression(OperatorExpressions as QueryOperators<E>);
        let entities: IterableIterator<WidenEntity<E>>;
        let storage: DatabaseValueStorage<E>;

        if (selector.entityType == 'guild') {
            entities = this.bot.client.guilds.cache.values() as IterableIterator<WidenEntity<E>>;
            storage = this.#guildsStorage as DatabaseValueStorage<E>;
        }
        else {
            const { id } = (options as unknown as { guild: Guild }).guild;
            entities = this.bot.client.guilds.cache.get(id)!.members.cache.values() as IterableIterator<WidenEntity<E>>;
            storage = this.#memberStorages.get(id) as DatabaseValueStorage<E>;
            if (!storage) {
                storage = new this.handler.memberPropertyStorageClass('member') as DatabaseValueStorage<E>;
                this.#memberStorages.set(id, storage as DatabaseValueStorage<'member'>);
            }
        }

        return await storage.selectEntities(entities, expression);
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
