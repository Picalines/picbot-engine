import { join, sep as pathSep } from "path";
import { CreateDatabaseHandler } from "../Handler.js";
import { existsSync, promises as fs } from "fs";
import { EntityStorage } from "../state/index.js";
import { CompiledExpression, compileExpression } from "./Expression.js";
import { Entity, EntityManager, EntityType } from "../Entity.js";
import { Selector } from "../selector/index.js";
import { Collection } from "discord.js";

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
        await Promise.all([usersDir, guildsDir, ...memberDirs].map(async dir => fs.mkdir(dir, { recursive: true })));
    };

    const compiledExpressions = new WeakMap<Selector<any, any>, CompiledExpression>();

    const usersStateMap = new Map<string, any>();
    const guildsStateMap = new Map<string, any>();
    const membersStateMap = new Map<string, Map<string, any>>();

    const createStateStorage = <E extends EntityType>(entityType: E, stateMap: Map<string, any>): EntityStorage<E> => ({
        clear() {
            stateMap.clear();
        },

        delete(entity) {
            stateMap.delete(entity.id);
        },

        accessState(entity, state) {
            let stateObj = stateMap.get(entity.id);
            if (!stateObj) {
                stateObj = {};
                stateMap.set(entity.id, stateObj);
            }
            return {
                set: async (value) => void (stateObj[state.name] = value),
                value: async () => stateObj[state.name] ?? state.defaultValue,
            };
        },

        async select(selector, { manager, variables, maxCount = Infinity }) {
            let arrowExpression = compiledExpressions.get(selector);
            if (!arrowExpression) {
                arrowExpression = compileExpression(selector.expression);
                compiledExpressions.set(selector, arrowExpression);
            }

            variables ??= {};
            const defaultSatate = database.defaultEntityState![entityType];
            const selected = [];

            for (const [id, entity] of manager.cache as Collection<string, Entity<E>>) {
                if (!arrowExpression({ ...defaultSatate, ...stateMap.get(id) }, variables)) {
                    continue;
                }

                selected.push(entity);
                if (selected.length >= maxCount) {
                    break;
                }
            }

            return selected;
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
        await fs.mkdir(dir, { recursive: true });

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
            fs.unlink(join(guildsDir, guild.id + '.json')).catch(() => { });
            fs.rmdir(join(membersDir, guild.id), { recursive: true, maxRetries: 3 });
        });
    }

    if (database.bot.options.cleanupMemberOnRemove) {
        database.bot.client.on('guildMemberRemove', member => {
            fs.unlink(join(membersDir, member.guild.id, member.id + '.json')).catch(() => { });
        });
    }

    return {
        preLoad: prepare,
        preSave: prepare,

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
            if (existsSync(path)) {
                return await loadEntities('member', path, members, membersMap);
            }
            else {
                return createStateStorage('member', membersMap);
            }
        },

        async saveMembersState(members) {
            const path = join(membersDir, members.guild.id);
            const membersMap = membersStateMap.get(members.guild.id)!;
            return await saveEntities(path, members, membersMap);
        },
    };
};
