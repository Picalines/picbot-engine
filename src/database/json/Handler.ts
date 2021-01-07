import { join } from "path";
import { mkdirSync, writeFileSync, existsSync, readFileSync, unlinkSync } from "fs";
import { Guild } from "discord.js";
import { createJsonStateStorage } from "./StateStorage";
import { Entity, EntityType } from "../Entity";
import { State, StateAccess, StateStorage } from "../state";
import { CreateDatabaseHandler } from "../Handler";

interface JsonHandlerOptions {
    databasePath: string,
    jsonIndent?: number,
}

export const createJsonDatabaseHandler = (options: JsonHandlerOptions): CreateDatabaseHandler => database => {
    const guildsDir = './' + join(options.databasePath, 'guilds/');

    const guildPath = (guild: Guild) => join(guildsDir, guild.id + '.json');

    const prepareGuildDir = () => mkdirSync(guildsDir, { recursive: true });

    let guildDbStates: State<'guild', any>[];
    let memberDbStates: State<'member', any>[];

    database.bot.loadingSequence.after('require states', 'json database: receive states', () => {
        const dbStates = [...database.cache.states.values()];
        guildDbStates = dbStates.filter(s => s.entityType == 'guild') as any;
        memberDbStates = dbStates.filter(s => s.entityType == 'member') as any;
    });

    database.bot.client.on('guildDelete', guild => {
        const path = guildPath(guild);
        if (existsSync(path)) {
            unlinkSync(path);
        }
    });

    return {
        createStateStorage: createJsonStateStorage(database),

        prepareForLoading() { prepareGuildDir() },
        prepareForSaving() { prepareGuildDir() },

        loadGuild(guild, guildState, membersState) {
            const path = guildPath(guild);
            if (!existsSync(path)) return;

            const dataObject = JSON.parse(readFileSync(path).toString());

            if (typeof dataObject.properties != 'object') {
                dataObject.properties = {};
            }

            if (typeof dataObject.members != 'object') {
                dataObject.members = {};
            }

            const setStateObject = <E extends EntityType>(entity: Entity<E>, entityStates: State<E, any>[], stateStorage: StateStorage<E>, stateObj: any) => {
                entityStates.forEach(state => {
                    if (state.key in stateObj) {
                        (stateStorage.store as any)(entity, state, stateObj[state.key]);
                    }
                });
            }

            setStateObject(guild, guildDbStates, guildState, dataObject.properties);

            for (const id in dataObject.members) {
                const member = guild.member(id);
                if (!member) {
                    continue;
                }

                setStateObject(member, memberDbStates, membersState, dataObject.members[id]);
            }
        },

        async saveGuild(guild, guildStateStorage, membersStateStorage) {
            const jsonObject = {
                properties: {} as Record<string, any>,
                members: {} as Record<string, Record<string, any>>,
            };

            const saveStates = <E extends EntityType>(target: any, key: string, entity: Entity<E>, states: State<E, any>[], stateStorage: StateStorage<E>) => {
                target[key] = {};
                let changes = 0;

                states.forEach(state => {
                    const value = stateStorage.restore(entity, state);
                    if (value !== undefined) {
                        target[key][state.key] = value;
                        changes++;
                    }
                });

                if (!changes) {
                    delete target[key];
                }
            };

            saveStates(jsonObject, 'properties', guild, guildDbStates, guildStateStorage);

            (await guild.members.fetch()).forEach(member => {
                saveStates(jsonObject.members, member.id, member, memberDbStates, membersStateStorage);
            });

            const json = JSON.stringify(jsonObject, null, options.jsonIndent);
            writeFileSync(guildPath(guild), json);
        },
    }
};
