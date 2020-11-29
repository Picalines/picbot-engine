import { Property } from "./property/Property";
import { EntitySelector, EntitySelectorOptions } from "./selector/Selector";
import { EntityType, Entity } from "./Entity";
import { PropertyAccess, PropertyAccessConstructor } from "./property/Access";
import { DatabaseValueStorage } from "./property/ValueStorage";
import { BotDatabaseHandler } from "./Handler";
import { Guild, GuildMember, GuildMemberManager } from "discord.js";
import { Bot } from "../Bot";
import { PropertyDefinitionStorage } from "./property/DefinitionStorage";
import { OperatorExpressions, QueryOperators } from "./selector/Operator";
import { filterIterable } from "../utils";
import { createEventStorage, EmitOf } from "../event";

/**
 * Класс базы данных бота
 */
export class BotDatabase {
    /**
     * Хранит свойства, которые использовала база данных
     */
    public readonly properties = new PropertyDefinitionStorage();

    #guildsStorage: DatabaseValueStorage<'guild'>;
    #memberStorages: Map<string, DatabaseValueStorage<'member'>>;

    /**
     * События базы данных
     */
    public readonly events;

    /**
     * Приватная функция вызова события
     */
    readonly #emit: EmitOf<BotDatabase['events']>;

    constructor(
        public readonly bot: Bot,
        public readonly handler: BotDatabaseHandler,
    ) {
        const [events, emit] = createEventStorage(this as BotDatabase, {
            beforeSaving() { },
            saved() { },
            beforeLoading() { },
            loaded() { },
        });

        this.events = events;
        this.#emit = emit;

        this.#guildsStorage = new this.handler.propertyStorageClass(this, 'guild') as any;
        this.#memberStorages = new Map();

        this.events.on('loaded', async () => await this.handler.onLoaded?.(this));
        this.events.on('saved', async () => await this.handler.onSaved?.(this));

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
    public accessProperty<E extends EntityType, T, A extends PropertyAccess<T>>(entity: Entity<E>, property: Property<E, T, A>): A {
        if (!this.properties.has(property.key)) {
            throw new Error(`${property.entityType} property with key '${property.key}' is not defined`);
        }

        type ValueStorage = DatabaseValueStorage<E>;
        let storage: ValueStorage | undefined = undefined;

        if ((entity as GuildMember).guild) {
            storage = this.#memberStorages.get((entity as GuildMember).guild.id) as ValueStorage | undefined;
        }
        else {
            storage = this.#guildsStorage as ValueStorage;
        }

        const constructor = (property.accessorClass ?? PropertyAccess) as PropertyAccessConstructor<T, A>;

        return new constructor(property, {
            set: async (value: T) => {
                if (!property.validate(value)) {
                    throw new Error(`value '${value}' is not valid for database property '${property.key}'`);
                }

                if (!storage) {
                    storage = new this.handler.propertyStorageClass(this, 'member') as ValueStorage;
                    this.#memberStorages.set((entity as GuildMember).guild.id, storage as DatabaseValueStorage<'member'>);
                }

                await storage.storeValue(entity, property.key, value);
            },

            async reset() {
                return await storage?.deleteValue(entity, property.key) ?? false;
            },

            async rawValue() {
                return await storage?.restoreValue(entity, property.key);
            },

            async value() {
                return await this.rawValue() ?? property.defaultValue;
            },
        });
    }

    /**
     * @returns список сущностей, которые база данных нашла по селектору ([[EntitySelector]])
     * @param selector селектор сущностей
     * @param options настройки селектора
     */
    public async selectEntities<E extends EntityType>(selector: EntitySelector<E>, options: EntitySelectorOptions<E>): Promise<Entity<E>[]> {
        options.maxCount ??= Infinity;
        if (options.maxCount <= 0) return [];

        const expression = selector.expression(OperatorExpressions as QueryOperators<E>);
        let storage: DatabaseValueStorage<E>;

        if (selector.entityType == 'guild') {
            storage = this.#guildsStorage as DatabaseValueStorage<E>;
        }
        else {
            const { guild } = options.manager as GuildMemberManager;
            storage = this.#memberStorages.get(guild.id) as DatabaseValueStorage<E>;
            if (!storage) {
                storage = new this.handler.propertyStorageClass(this, 'member') as DatabaseValueStorage<E>;
                this.#memberStorages.set(guild.id, storage as DatabaseValueStorage<'member'>);
            }
        }

        let entities = options.manager.cache.values() as IterableIterator<Entity<E>>;
        if (options.filter) {
            entities = filterIterable(entities, options.filter);
        }

        const selected = await storage.selectEntities(entities, expression, options.maxCount);
        if (!selected.length && options.throwOnNotFound) {
            throw options.throwOnNotFound;
        }

        return selected.slice(0, options.maxCount);
    }

    /**
     * Загружает базу данных
     * @emits beforeLoading
     * @emits loaded
     */
    public async load(): Promise<void> {
        this.bot.logger.task(`loading ${this.bot.username}'s database...`);

        this.#emit('beforeLoading');

        if (this.handler.prepareForLoading) {
            this.bot.logger.task('preparing...');
            await this.handler.prepareForLoading(this);
            this.bot.logger.endTask('success', 'prepared successfully');
        }

        if (this.handler.loadGuild) {
            this.bot.logger.task('loading guilds...');

            const guildsToLoad = this.bot.client.guilds.cache.map(g => g.id);

            const getLoadingPromise = async (id: string) => {
                const guild = await this.bot.client.guilds.fetch(id, true);
                await this.handler.loadGuild!(this, guild);
                return guild;
            };

            for await (const guild of guildsToLoad.map(getLoadingPromise)) {
                this.bot.logger.log(guild.name);
            }

            this.bot.logger.endTask('success', 'guilds successfully loaded')
        }

        this.bot.logger.endTask('success', `${this.bot.username}'s database successfully loaded`);

        this.#emit('loaded');
    }

    /**
     * Сохраняет базу данных
     * @emits beforeSaving
     * @emits saved
     */
    public async save(): Promise<void> {
        this.bot.logger.task(`saving ${this.bot.username}'s database...`);

        this.#emit('beforeSaving');

        if (this.handler.prepareForSaving) {
            this.bot.logger.task('preparing...');
            await this.handler.prepareForSaving(this);
            this.bot.logger.endTask('success', 'prepared successfully');
        }

        if (this.handler.saveGuild) {
            this.bot.logger.task('saving guilds...');

            const { cache: guildsToSave } = this.bot.client.guilds;

            const getSavingPromise = async (guild: Guild) => {
                await this.handler.saveGuild!(this, guild);
                return guild;
            }

            for await (const guild of guildsToSave.map(getSavingPromise)) {
                this.bot.logger.log(guild.name);
            }

            this.bot.logger.endTask('success', 'guilds successfully saved');
        }

        this.bot.logger.endTask('success', `${this.bot.username}'s database successfully saved`);

        this.#emit('saved');
    }
}
