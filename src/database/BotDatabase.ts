import { Guild, GuildMember, GuildMemberManager } from "discord.js";
import { createEventStorage, EmitOf } from "../event";
import { PropertyAccessConstructor, Property, PropertyAccess, DatabaseValueStorage as ValueStorage, AnyProperty } from "./property";
import { AnyEntitySelector, EntitySelector, EntitySelectorOptions, OperatorExpressions, QueryOperators, SelectorVars } from "./selector";
import { EntityType, Entity } from "./Entity";
import { BotDatabaseHandler } from "./Handler";
import { AnyConstructor, createGroupedCache, filterIterable } from "../utils";
import { Bot } from "../Bot";
import { requireFolder } from "../utils/RequireFolder";

/**
 * Класс базы данных бота
 */
export class BotDatabase {
    /**
     * Кэш базы данных
     */
    public readonly cache;

    #guildsStorage: ValueStorage<'guild'>;
    #memberStorages: Map<string, ValueStorage<'member'>>;

    /**
     * События базы данных
     */
    public readonly events;

    /**
     * Приватная функция вызова события
     */
    readonly #emit: EmitOf<BotDatabase['events']>;

    /**
     * @param bot ссылка на бота
     * @param handler обработчик базы данных
     */
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

        const [caches, addToCache] = createGroupedCache({
            properties: Property as AnyConstructor<AnyProperty>,
            selectors: EntitySelector as AnyConstructor<AnyEntitySelector>,
        });

        this.cache = caches;

        this.bot.loadingSequence.stage('require properties', () => requireFolder(Property, this.bot.options.loadingPaths.properties).forEach(([path, p]) => {
            addToCache.properties(p);
            this.bot.logger.log(path);
        }));

        this.bot.loadingSequence.stage('require selectors', () => requireFolder(EntitySelector, this.bot.options.loadingPaths.selectors).forEach(([path, s]) => {
            addToCache.selectors(s);
            this.bot.logger.log(path);
        }));

        this.bot.loadingSequence.after('login', 'load database', async () => {
            await this.load();
        });

        this.#guildsStorage = new this.handler.propertyStorageClass(this, 'guild') as any;
        this.#memberStorages = new Map();

        this.events.on('loaded', () => this.handler.onLoaded?.(this));
        this.events.on('saved', () => this.handler.onSaved?.(this));

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
        if (!this.cache.properties.has(property)) {
            throw new Error(`unknown ${property.entityType} property '${property.key}'`);
        }

        let storage: ValueStorage<any> | undefined = undefined;

        if ((entity as GuildMember).guild) {
            storage = this.#memberStorages.get((entity as GuildMember).guild.id);
        }
        else {
            storage = this.#guildsStorage;
        }

        const constructor = (property.accessorClass ?? PropertyAccess) as PropertyAccessConstructor<T, A>;

        return new constructor(property, {
            set: async value => {
                if (!property.validate(value)) {
                    throw new Error(`value '${value}' is not valid for database property '${property.key}'`);
                }

                if (!storage) {
                    storage = new this.handler.propertyStorageClass(this, 'member');
                    this.#memberStorages.set((entity as GuildMember).guild.id, storage as ValueStorage<'member'>);
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
    public async selectEntities<E extends EntityType, Vars extends SelectorVars>(selector: EntitySelector<E, Vars>, options: EntitySelectorOptions<E, Vars>): Promise<Entity<E>[]> {
        if (!this.cache.selectors.has(selector)) {
            throw new Error(`unknown ${selector.entityType} selector`);
        }

        const { maxCount = Infinity } = options;
        if (maxCount <= 0) return [];

        const expression = selector.expression(OperatorExpressions as QueryOperators<E, Vars>);
        let storage: ValueStorage<any>;

        if (selector.entityType == 'guild') {
            storage = this.#guildsStorage;
        }
        else {
            const { guild } = options.manager as GuildMemberManager;
            storage = this.#memberStorages.get(guild.id)!;
            if (!storage) {
                storage = new this.handler.propertyStorageClass(this, 'member');
                this.#memberStorages.set(guild.id, storage);
            }
        }

        let entities = options.manager.cache.values() as IterableIterator<Entity<E>>;
        if (options.filter) {
            entities = filterIterable(entities, options.filter);
        }

        const selectedGen = (storage as ValueStorage<E>).selectEntities(entities, selector as any, expression, options.variables);
        const selected: Entity<E>[] = [];

        const checkBreak = maxCount == Infinity ? (() => false) : (() => selected.length >= maxCount);

        for await (const entity of selectedGen) {
            selected.push(entity);
            if (checkBreak()) {
                break;
            }
        }

        if (!selected.length && options.throwOnNotFound) {
            throw options.throwOnNotFound;
        }

        return selected;
    }

    /**
     * Загружает базу данных
     * @emits beforeLoading
     * @emits loaded
     */
    private async load(): Promise<void> {
        this.#emit('beforeLoading');

        if (this.handler.prepareForLoading) {
            this.bot.logger.task('preparing');
            await this.handler.prepareForLoading(this);
            this.bot.logger.endTask('success', 'prepared');
        }

        if (this.handler.loadGuild) {
            this.bot.logger.task('guilds');

            const guildsToLoad = this.bot.client.guilds.cache.map(g => g.id);

            const getLoadingPromise = async (id: string) => {
                const guild = await this.bot.client.guilds.fetch(id, true);
                await this.handler.loadGuild!(this, guild);
                return guild;
            };

            for await (const guild of guildsToLoad.map(getLoadingPromise)) {
                this.bot.logger.log(guild.name);
            }

            this.bot.logger.endTask('success', '')
        }

        this.#emit('loaded');
    }

    /**
     * Сохраняет базу данных
     * @emits beforeSaving
     * @emits saved
     */
    public async save(): Promise<void> {
        this.bot.logger.task(`saving ${this.bot.username}'s database`);

        this.#emit('beforeSaving');

        if (this.handler.prepareForSaving) {
            this.bot.logger.task('preparing');
            await this.handler.prepareForSaving(this);
            this.bot.logger.endTask('success', 'prepared');
        }

        if (this.handler.saveGuild) {
            this.bot.logger.task('guilds');

            const { cache: guildsToSave } = this.bot.client.guilds;

            const getSavingPromise = async (guild: Guild) => {
                await this.handler.saveGuild!(this, guild);
                return guild;
            }

            for await (const guild of guildsToSave.map(getSavingPromise)) {
                this.bot.logger.log(guild.name);
            }

            this.bot.logger.endTask('success', '');
        }

        this.bot.logger.endTask('success', '');

        this.#emit('saved');
    }
}
