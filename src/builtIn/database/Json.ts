/// <reference lib="es2019.object" />

import { mkdirSync, writeFileSync, existsSync, readFileSync, unlinkSync } from "fs";
import { BotDatabase, BotDatabaseHandler } from "../../database/Bot";
import { join, resolve } from "path";
import { Guild } from "discord.js";

type JsonHandler = { dirPath: string, guildsPath: string, jsonIndent?: number };

export function getJsonHandler(options: JsonHandler): BotDatabaseHandler {
    const guildsPath = resolve(join('.', options.dirPath, options.guildsPath));

    const [beforeLoad, beforeSave] = ['loading', 'saving'].map(action => (database: BotDatabase) => {
        mkdirSync(guildsPath, { recursive: true });
        console.log(`${action} ${database.bot.username}'s database (json)...`);
    });

    const [loaded, saved] = ['loaded', 'saved'].map(event => (database: BotDatabase) => {
        console.log(`${database.bot.username}'s database successfully ${event} (json)`);
    });

    const getGuildPath = (guild: Guild) => join(guildsPath, guild.id + '.json');

    return {
        beforeLoad, beforeSave,
        loaded, saved,

        saveGuild: (guildData) => {
            const saveDataObject = {
                prefixes: guildData.prefixes.list,
                members: {} as Record<string, any>,
            };

            for (const memberData of guildData.members) {
                if (!memberData.map) continue;
                const entries = memberData.map.entries();
                saveDataObject.members[memberData.member.id] = Object.fromEntries(entries);
            }
            writeFileSync(getGuildPath(guildData.guild), JSON.stringify(saveDataObject, null, options.jsonIndent));

            console.log(`* guild '${guildData.guild.name}' successfully saved`);
        },

        loadGuild: (guildData) => {
            const path = getGuildPath(guildData.guild);
            if (!existsSync(path)) return;

            const dataObject = JSON.parse(readFileSync(path).toString());

            if (dataObject.prefixes instanceof Array) {
                guildData.prefixes.list = dataObject.prefixes;
            }

            if (typeof dataObject.members == 'object') {
                for (const [id, memberSavedMap] of Object.entries<any>(dataObject.members)) {
                    const member = guildData.guild.member(id);
                    if (!member) continue;
                    guildData.getMemberData(member).map = new Map(Object.entries(memberSavedMap));
                }
            }

            console.log(`* guild '${guildData.guild.name}' successfully loaded`);
        },

        guildDelete: (guildData) => {
            const path = getGuildPath(guildData.guild);
            if (existsSync(path)) {
                unlinkSync(path);
            }
        }
    };
}
