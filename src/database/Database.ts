import { GuildMemberManager } from "discord.js";
import { assert } from "../utils/index.js";
import { State, StateAccess, EntityStorage } from "./state/index.js";
import { Selector, SelectorOptions, OperatorExpressions, QueryOperators, SelectorVars } from "./selector/index.js";
import { EntityType, Entity, checkEntityType } from "./Entity.js";
import { DatabaseHandler } from "./Handler.js";
import { Bot } from "../bot/index.js";
import { Event } from "../event/Event.js";

export class Database {
    readonly events = Object.freeze({
        beforeSaving: new Event<[]>(),
        saved: new Event<[]>(),
        beforeLoading: new Event<[]>(),
        loaded: new Event<[]>(),
    });

    #handler!: DatabaseHandler;

    #usersStorage!: EntityStorage<'user'>;
    #guildsStorage!: EntityStorage<'guild'>;
    #memberStorage = new Map<string, EntityStorage<'member'>>();

    readonly defaultEntityState!: { [K in EntityType]: Readonly<Record<string, any>> };

    constructor(readonly bot: Bot) {
        this.bot.loadingSequence.add({
            name: 'import states',
            task: async () => {
                const groupedStates: Record<EntityType, State<any, any>[]> = { user: [], guild: [], member: [] };

                await this.bot.importer.forEach('states', state => {
                    groupedStates[state.entityType].push(state);
                });

                (this as any).defaultEntityState = { user: {}, guild: {}, member: {} };

                for (const entityType in groupedStates) {
                    groupedStates[entityType as EntityType].forEach(state => {
                        (this as any).defaultEntityState[entityType][state.name] = state.defaultValue;
                    });
                }
            },
        });

        this.bot.loadingSequence.add({
            name: 'import selectors',
            task: () => this.bot.importer.import('selectors'),
        });

        this.bot.loadingSequence.add({
            name: 'load database',
            runsAfter: 'login',
            task: async () => {
                this.events.beforeLoading.emit();

                this.#handler = this.bot.options.databaseHandler(this);

                await this.#handler.preLoad?.();

                await this.bot.logger.promiseTask('users', async () => {
                    this.#usersStorage = await this.#handler.loadUsersState(this.bot.client.users);
                });

                await this.bot.logger.promiseTask('guilds', async () => {
                    this.#guildsStorage = await this.#handler.loadGuildsState(this.bot.client.guilds);
                });

                await this.bot.logger.promiseTask('members', () => Promise.all(
                    this.bot.client.guilds.cache.map(async guild => {
                        this.#memberStorage.set(guild.id, await this.#handler.loadMembersState!(guild.members));
                    })
                ));

                await this.#handler.postLoad?.();

                this.events.loaded.emit();
            },
        });

        this.bot.shutdownSequence.add({
            name: 'save database',
            runsAfter: 'logout',
            task: async () => {
                this.events.beforeSaving.emit();

                await this.#handler.preSave?.();

                if (this.#handler.saveUsersState) {
                    await this.bot.logger.promiseTask('users', () => this.#handler.saveUsersState!(this.bot.client.users));
                }

                if (this.#handler.saveGuildsState) {
                    await this.bot.logger.promiseTask('guilds', () => this.#handler.saveGuildsState!(this.bot.client.guilds));
                }

                if (this.#handler.saveMembersState) {
                    await this.bot.logger.promiseTask('members', () => Promise.all(
                        this.bot.client.guilds.cache.map(guild => this.#handler.saveMembersState!(guild.members))
                    ));
                }

                await this.#handler.postSave?.();

                this.events.saved.emit();
            },
        });

        this.bot.client.on('guildCreate', async guild => {
            const storage = await this.#handler.loadMembersState(guild.members);
            this.#memberStorage.set(guild.id, storage);
        });

        if (this.bot.options.cleanupGuildOnDelete) {
            bot.client.on('guildDelete', async guild => {
                await this.#memberStorage.get(guild.id)?.clear();
                this.#memberStorage.delete(guild.id);
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
        assert(this.bot.importer.isImported('states', state as any), `unknown ${state.entityType} state '${state.name}'`);

        const storage: EntityStorage<any> = checkEntityType(entity, 'member')
            ? this.#memberStorage.get(entity.guild.id)!
            : (checkEntityType(entity, 'user') ? this.#usersStorage : this.#guildsStorage);

        let access = storage.accessState(entity, state) as A;
        if (state.accessFabric) {
            access = state.accessFabric(access, entity);
        }

        return access;
    }

    async selectEntities<E extends EntityType, Vars extends SelectorVars>(selector: Selector<E, Vars>, options: SelectorOptions<E, Vars>): Promise<Entity<E>[]> {
        assert(this.bot.importer.isImported('selectors', selector as any), `unknown ${selector.entityType} selector`);

        const { maxCount = Infinity } = options;
        if (maxCount <= 0) return [];

        const storage: EntityStorage<any> =
            selector.entityType == 'user' ? this.#usersStorage :
                selector.entityType == 'guild' ? this.#guildsStorage :
                    this.#memberStorage.get((options.manager as GuildMemberManager).guild.id)!;

        const selected = await storage.select(selector, options);

        selected.length = Math.min(selected.length, maxCount);

        return selected as any;
    }
}
