import { join, sep as pathSep } from "path";
import { CreateDatabaseHandler } from "../Handler.js";
import { promises as fs } from "fs";
import { StateStorage } from "../state/index.js";
import { CompiledExpression, compileExpression } from "./Expression.js";
import { AnyEntitySelector } from "../selector/index.js";
import { EntityManager, EntityType } from "../Entity.js";

interface JsonHandlerOptions {
    databasePath: string,
    jsonIndent?: number,
}

export const createJsonDatabaseHandler = (options: JsonHandlerOptions): CreateDatabaseHandler => database => {
    const currentDir = '.' + pathSep;
    const usersDir = currentDir + join(options.databasePath, 'users');
    const guildsDir = currentDir + join(options.databasePath, 'guilds');
    const membersDir = currentDir + join(options.databasePath, 'members');

    const prepare = async () => {
        const memberDirs = database.bot.client.guilds.cache.map((_, guildId) => join(membersDir, guildId));
        await Promise.all([usersDir, guildsDir, ...memberDirs].map(async dir => fs.mkdir(dir, { recursive: true })))
    };

    const compiledExpressions = new WeakMap<AnyEntitySelector, CompiledExpression>();

    const usersStateMap = new Map<string, any>();
    const guildsStateMap = new Map<string, any>();
    const membersStateMap = new Map<string, Map<string, any>>();

    const createStateStorage = <E extends EntityType>(entityType: E, stateMap: Map<string, any>): StateStorage<E> => ({
        clear() {
            stateMap.clear();
        },

        delete(entity) {
            stateMap.delete(entity.id);
        },

        entity(entity) {
            let state = stateMap.get(entity.id);
            if (!state) {
                state = {};
                stateMap.set(entity.id, state);
            }
            return {
                store: ({ name }, value) => void (state[name] = value),
                restore: ({ name }) => state[name],
                reset: ({ name }) => void delete state[name],
            };
        },

        *select(entities, selector, expression, vars) {
            let arrowExpression = compiledExpressions.get(selector);
            if (!arrowExpression) {
                arrowExpression = compileExpression(expression);
                compiledExpressions.set(selector, arrowExpression);
            }

            const defaultSatate = database.defaultEntityState![entityType];

            for (const entity of entities) {
                if (arrowExpression({ ...defaultSatate, ...stateMap.get(entity.id) }, vars)) {
                    yield entity;
                }
            }
        },
    });

    const testEntityFile = RegExp.prototype.test.bind(/\d+\.json/);

    const loadEntities = async <E extends EntityType>(entityType: E, dir: string, manager: EntityManager<E>, entityMap: Map<string, any>) => {
        const entityFiles = (await fs.readdir(dir)).filter(testEntityFile);

        const loadPromises = entityFiles.map(async entityFile => {
            const path = join(dir, entityFile);
            const entityId = entityFile.slice(0, -5);

            if (!manager.cache.has(entityId)) {
                return undefined;
            }

            const entityData = await fs.readFile(path);

            try {
                return [entityId, JSON.parse(entityData.toString())] as [id: string, data: any];
            }
            catch {
                database.bot.logger.warning(`invalid json in ${path}`);
                return undefined;
            }
        });

        for await (const entityData of loadPromises) {
            if (!entityData) continue;
            entityMap.set(...entityData);
        }

        return createStateStorage(entityType, entityMap);
    };

    const isEmpty = (state: any) => Object.keys(state).length == 0;

    const saveEntities = async <E extends EntityType>(dir: string, manager: EntityManager<E>, entityMap: Map<string, any>) => {
        const savePromises = [] as Promise<void>[];

        entityMap.forEach((entityState, entityId) => {
            const path = join(dir, entityId + '.json');

            if (!manager.cache.has(entityId) || isEmpty(entityState)) {
                savePromises.push(fs.unlink(path).catch(() => { }));
            }
            else {
                savePromises.push(fs.writeFile(path, JSON.stringify(entityState)));
            }
        });

        await Promise.all(savePromises);
    };

    if (database.bot.options.cleanupGuildOnDelete) {
        database.bot.client.on('guildDelete', guild => {
            fs.unlink(join(guildsDir, guild.id + '.json')).catch(() => {});
            fs.rmdir(join(membersDir, guild.id), { recursive: true, maxRetries: 3 });
        });
    }

    if (database.bot.options.cleanupMemberOnRemove) {
        database.bot.client.on('guildMemberRemove', member => {
            fs.unlink(join(membersDir, member.guild.id, member.id + '.json')).catch(() => {});
        });
    }

    return {
        prepareForLoading: prepare,
        prepareForSaving: prepare,

        async loadUsersState(users) {
            return await loadEntities('user', usersDir, users, usersStateMap);
        },

        async saveUsersState(users) {
            return await saveEntities(usersDir, users, usersStateMap);
        },

        async loadGuildsState(guilds) {
            return await loadEntities('guild', guildsDir, guilds, guildsStateMap);
        },

        async saveGuildsState(guilds) {
            return await saveEntities(guildsDir, guilds, guildsStateMap);
        },

        async loadMembersState(members) {
            const path = join(membersDir, members.guild.id);
            const membersMap = new Map();
            membersStateMap.set(members.guild.id, membersMap);
            return await loadEntities('member', path, members, membersMap);
        },

        async saveMembersState(members) {
            const path = join(membersDir, members.guild.id);
            const membersMap = membersStateMap.get(members.guild.id)!;
            return await saveEntities(path, members, membersMap);
        },

        async prepareCreatedGuild(guild) {
            const membersMap = new Map();
            membersStateMap.set(guild.id, membersMap);
            return createStateStorage('member', membersMap);
        },
    };
};
