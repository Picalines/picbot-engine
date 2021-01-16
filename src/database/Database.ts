import { Guild, GuildMember, GuildMemberManager } from "discord.js";
import { createEventStorage } from "../event/index.js";
import { AnyConstructor, assert, createGroupedCache, filterIterable, importFolder } from "../utils/index.js";
import { State, StateAccess, StateStorage, AnyState, createStateBaseAccess } from "./state/index.js";
import { AnyEntitySelector, EntitySelector, EntitySelectorOptions, OperatorExpressions, QueryOperators, SelectorVarsDefinition } from "./selector/index.js";
import { EntityType, Entity, AnyEntity, checkEntityType } from "./Entity.js";
import { DatabaseHandler } from "./Handler.js";
import { Bot } from "../bot/index.js";

export class Database {
    readonly cache;

    readonly events;
    readonly #emit;

    #handler!: DatabaseHandler;

    #usersStorage!: StateStorage<'user'>;
    #guildsStorage!: StateStorage<'guild'>;
    #memberStorage = new Map<string, StateStorage<'member'>>();

    readonly defaultEntityState!: { [K in EntityType]: Readonly<Record<string, any>> };

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

        this.bot.loadingSequence.stage('import states', async () => {
            const groupedStates: Record<EntityType, AnyState[]> = { user: [], guild: [], member: [] };

            (await importFolder(State, this.bot.options.loadingPaths.states)).forEach(({ path, item: state }) => {
                addToCache.states(state);
                this.bot.logger.log(path);
                groupedStates[state.entityType].push(state);
            });

            (this as any).defaultEntityState = { user: {}, guild: {}, member: {} };

            for (const entityType in groupedStates) {
                groupedStates[entityType as EntityType].forEach(state => {
                    (this as any).defaultEntityState[entityType as EntityType][state.name] = state.defaultValue;
                });
            }
        });

        this.bot.loadingSequence.stage('import selectors', async () => {
            (await importFolder(EntitySelector, this.bot.options.loadingPaths.selectors)).forEach(({ path, item: selector }) => {
                addToCache.selectors(selector);
                this.bot.logger.log(path);
            });
        });

        this.bot.loadingSequence.after('login', 'load database', async () => {
            this.#emit('beforeLoading');

            this.#handler = this.bot.options.databaseHandler(this);

            await this.#handler.prepareForLoading?.();

            await this.bot.logger.promiseTask('users', async () => {
                this.#usersStorage = await this.#handler.loadUsersState(this.bot.client.users);
            });

            await this.bot.logger.promiseTask('guilds', async () => {
                this.#guildsStorage = await this.#handler.loadGuildsState(this.bot.client.guilds);
            });

            await this.bot.logger.promiseTask('members', async () => {
                type LoadResult = [guildId: string, state: StateStorage<"member">];
                const promises = this.bot.client.guilds.cache.map(async guild => {
                    const state = await this.#handler.loadMembersState!(guild.members);
                    return [guild.id, state] as LoadResult;
                });

                for await (const [guildId, state] of promises) {
                    this.#memberStorage.set(guildId, state);
                }
            });

            this.#emit('loaded');
        });

        this.bot.shutdownSequence.after('logout', 'save database', async () => {
            this.#emit('beforeSaving');

            await this.#handler.prepareForSaving?.();

            if (this.#handler.saveUsersState) {
                await this.bot.logger.promiseTask('users', async () => {
                    await this.#handler.saveUsersState!(this.bot.client.users);
                });
            }

            if (this.#handler.saveGuildsState) {
                await this.bot.logger.promiseTask('guilds', async () => {
                    await this.#handler.saveGuildsState!(this.bot.client.guilds);
                });
            }

            if (this.#handler.saveMembersState) {
                await this.bot.logger.promiseTask('members', async () => {
                    const promises = this.bot.client.guilds.cache.map(guild => {
                        return this.#handler.saveMembersState!(guild.members);
                    });
                    await Promise.all(promises);
                });
            }

            this.#emit('saved');
        });

        this.bot.client.on('guildCreate', async guild => {
            const storage = await this.#handler.prepareCreatedGuild(guild);
            this.#memberStorage.set(guild.id, storage);
        });

        if (this.bot.options.cleanupGuildOnDelete) {
            bot.client.on('guildDelete', async guild => {
                await this.#memberStorage.get(guild.id)?.clear();
                this.#memberStorage.delete(guild.id)
                await this.#guildsStorage.delete(guild);
            });
        }

        if (this.bot.options.cleanupMemberOnRemove) {
            bot.client.on('guildMemberRemove', async member => {
                const memberStorage = this.#memberStorage.get(member.guild.id);
                if (memberStorage) {
                    member = member.partial ? await member.fetch() : member;
                    await memberStorage.delete(member);
                }
            });
        }
    }

    accessState<E extends EntityType, T, A extends StateAccess<T>>(entity: Entity<E>, state: State<E, T, A>): A {
        assert(this.cache.states.has(state), `unknown ${state.entityType} state '${state.name}'`);

        let storage: StateStorage<any>;

        if (checkEntityType(entity, 'member')) {
            storage = this.#memberStorage.get(entity.guild.id)!;
        }
        else {
            storage = checkEntityType(entity, 'user') ? this.#usersStorage : this.#guildsStorage;
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

        if (selector.entityType == 'user') {
            storage = this.#usersStorage;
        }
        else if (selector.entityType == 'user') {
            storage = this.#guildsStorage;
        }
        else {
            storage = this.#memberStorage.get((options.manager as GuildMemberManager).guild.id)!;
        }

        let entities = options.manager.cache.values() as IterableIterator<Entity<E>>;
        if (options.filter) {
            entities = filterIterable(entities, options.filter);
        }

        const selectedGen = storage.select(entities, selector as any, expression, options.variables as any);
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
}
