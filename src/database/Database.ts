import { Guild, GuildMember, GuildMemberManager } from "discord.js";
import { createEventStorage } from "../event/index.js";
import { AnyConstructor, assert, createGroupedCache, filterIterable, importFolder } from "../utils/index.js";
import { State, StateAccess, StateStorage, AnyState, createStateBaseAccess } from "./state/index.js";
import { AnyEntitySelector, EntitySelector, EntitySelectorOptions, OperatorExpressions, QueryOperators, SelectorVarsDefinition } from "./selector/index.js";
import { EntityType, Entity, AnyEntity } from "./Entity.js";
import { DatabaseHandler } from "./Handler.js";
import { Bot } from "../bot/index.js";

export class Database {
    readonly handler: DatabaseHandler;

    readonly cache;

    readonly events;
    readonly #emit;

    #guildsStorage: StateStorage<'guild'>;
    #memberStorage: Map<string, StateStorage<'member'>>;

    #defaultEntityState: undefined | { [K in EntityType]: Record<string, any> };

    get defaultEntityState(): undefined | { readonly [K in EntityType]: Readonly<Record<string, any>> } {
        return this.#defaultEntityState;
    }

    constructor(readonly bot: Bot) {
        const [events, emit] = createEventStorage(this as Database, {
            beforeSaving() { },
            saved() { },
            beforeLoading() { },
            loaded() { },
        });

        this.events = events;
        this.#emit = emit;

        const [caches, addToCache] = createGroupedCache({
            states: State as AnyConstructor<AnyState>,
            selectors: EntitySelector as AnyConstructor<AnyEntitySelector>,
        });

        this.cache = caches;

        this.#defaultEntityState = undefined;

        this.bot.loadingSequence.stage('require states', async () => {
            const groupedStates: Record<EntityType, AnyState[]> = { guild: [], member: [] };

            (await importFolder(State, this.bot.options.loadingPaths.states)).forEach(({ path, item: state }) => {
                addToCache.states(state);
                this.bot.logger.log(path);
                groupedStates[state.entityType].push(state);
            });

            this.#defaultEntityState = { guild: {}, member: {} };

            for (const entityType in groupedStates) {
                groupedStates[entityType as EntityType].forEach(state => {
                    this.#defaultEntityState![entityType as EntityType][state.name] = state.defaultValue;
                });
            }
        });

        this.bot.loadingSequence.stage('require selectors', async () => {
            (await importFolder(EntitySelector, this.bot.options.loadingPaths.selectors)).forEach(({ path, item: selector }) => {
                addToCache.selectors(selector);
                this.bot.logger.log(path);
            });
        });

        this.bot.loadingSequence.after('login', 'load database', async () => {
            await this.load();
        });

        this.bot.shutdownSequence.after('logout', 'save database', async () => {
            await this.save();
        });

        this.handler = this.bot.options.databaseHandler(this);

        this.#guildsStorage = this.handler.createStateStorage('guild');
        this.#memberStorage = new Map();

        if (this.bot.options.cleanupGuildOnDelete) {
            bot.client.on('guildDelete', async guild => {
                await this.#memberStorage.get(guild.id)?.clear();
                this.#memberStorage.delete(guild.id)
                await this.#guildsStorage.deleteEntity(guild);
            });
        }

        if (this.bot.options.cleanupMemberOnRemove) {
            bot.client.on('guildMemberRemove', async member => {
                const memberStorage = this.#memberStorage.get(member.guild.id);
                if (memberStorage) {
                    member = member.partial ? await member.fetch() : member;
                    await memberStorage.deleteEntity(member);
                }
            });
        }
    }

    accessState<E extends EntityType, T, A extends StateAccess<T>>(entity: Entity<E>, state: State<E, T, A>): A {
        assert(this.cache.states.has(state), `unknown ${state.entityType} state '${state.name}'`);

        let storage: StateStorage<any>;

        const guildId: string | undefined = (entity as GuildMember).guild?.id;

        if (!guildId) {
            storage = this.#guildsStorage;
        }
        else {
            storage = this.membersStateStorage(guildId)
        }

        let access = createStateBaseAccess(state, storage, entity) as A;
        if (state.accessFabric) {
            access = state.accessFabric(access, entity);
        }

        return access;
    }

    async selectEntities<E extends EntityType, Vars extends SelectorVarsDefinition>(selector: EntitySelector<E, Vars>, options: EntitySelectorOptions<E, Vars>): Promise<Entity<E>[]> {
        assert(this.cache.selectors.has(selector as any), `unknown ${selector.entityType} selector`);

        const { maxCount = Infinity } = options;
        if (maxCount <= 0) return [];

        const expression = selector.expression(OperatorExpressions as unknown as QueryOperators<E, Vars>);
        let storage: StateStorage<any>;

        if (selector.entityType == 'guild') {
            storage = this.#guildsStorage;
        }
        else {
            const { guild } = options.manager as GuildMemberManager;
            storage = this.#memberStorage.get(guild.id)!;
            if (!storage) {
                storage = this.handler.createStateStorage('member');
                this.#memberStorage.set(guild.id, storage);
            }
        }

        let entities = options.manager.cache.values() as IterableIterator<Entity<E>>;
        if (options.filter) {
            entities = filterIterable(entities, options.filter);
        }

        const selectedGen = storage.selectEntities(entities, selector as any, expression, options.variables as any);
        const selected: AnyEntity[] = [];

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

        return selected as Entity<E>[];
    }

    private async load(): Promise<void> {
        this.#emit('beforeLoading');

        if (this.handler.prepareForLoading) {
            this.bot.logger.task('preparing');
            await this.handler.prepareForLoading();
            this.bot.logger.done('success', 'prepared');
        }

        if (this.handler.loadGuild) {
            this.bot.logger.task('guilds');

            const guildsToLoad = this.bot.client.guilds.cache.map(g => g.id);

            const getLoadingPromise = async (id: string) => {
                const guild = await this.bot.client.guilds.fetch(id, true);
                await this.handler.loadGuild!(guild, this.#guildsStorage, this.membersStateStorage(id));
                return guild;
            };

            for await (const guild of guildsToLoad.map(getLoadingPromise)) {
                this.bot.logger.log(guild.name);
            }

            this.bot.logger.done('success', '')
        }

        this.#emit('loaded');
    }

    private async save(): Promise<void> {
        this.#emit('beforeSaving');

        if (this.handler.prepareForSaving) {
            this.bot.logger.task('preparing');
            await this.handler.prepareForSaving();
            this.bot.logger.done('success', 'prepared');
        }

        if (this.handler.saveGuild) {
            this.bot.logger.task('guilds');

            const { cache: guildsToSave } = this.bot.client.guilds;

            const getSavingPromise = async (guild: Guild) => {
                await this.handler.saveGuild!(guild, this.#guildsStorage, this.membersStateStorage(guild.id));
                return guild;
            }

            for await (const guild of guildsToSave.map(getSavingPromise)) {
                this.bot.logger.log(guild.name);
            }

            this.bot.logger.done('success', '');
        }

        this.#emit('saved');
    }

    private membersStateStorage(guildId: string): StateStorage<'member'> {
        let storage = this.#memberStorage.get(guildId);

        if (!storage) {
            storage = this.handler.createStateStorage('member');
            this.#memberStorage.set(guildId, storage);
        }

        return storage;
    }
}
