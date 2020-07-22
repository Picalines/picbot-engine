/// <reference lib="es2019.object" />

import { mkdirSync, writeFileSync, existsSync, readFileSync } from "fs";
import { join, resolve } from "path";
import { BotDatabase } from "../../database/Bot";
import { Guild } from "discord.js";

export type JsonDatabaseOptions = {
    dirPath: string;
    guildsPath: string;
}

export function JsonDatabase(botDatabase: BotDatabase, options: JsonDatabaseOptions) {
    const guildsPath = resolve(join('.', options.dirPath, options.guildsPath));

    [['beforeLoad', 'loading'], ['beforeSave', 'saving']].forEach(([event, action]) => {
        botDatabase.on(event, () => {
            mkdirSync(guildsPath, { recursive: true });
            console.log(`${action} ${botDatabase.bot.username}'s database (json)...`);
        });
    });

    ['loaded', 'saved'].forEach(event => {
        botDatabase.on(event, () => {
            console.log(`${botDatabase.bot.username}'s database successfully ${event}`);
        });
    });

    const guildPath = (guild: Guild) => join(guildsPath, guild.id + '.json');

    botDatabase.on('saveGuild', data => {
        const saveDataObject = {
            prefixes: data.prefixes.list,
            members: {} as Record<string, any>,
        };
        for (const memberData of data.members) {
            if (!memberData.map) continue;
            const entries = memberData.map.entries();
            saveDataObject.members[memberData.member.id] = Object.fromEntries(entries);
        }
        writeFileSync(guildPath(data.guild), JSON.stringify(saveDataObject));
    });

    botDatabase.on('loadGuild', guild => {
        const path = guildPath(guild);
        if (!existsSync(path)) return;

        const dataObject = JSON.parse(readFileSync(path).toString());
        const guildData = botDatabase.getGuildData(guild);

        if (dataObject.prefixes instanceof Array) {
            guildData.prefixes.list = dataObject.prefixes;
        }

        if (typeof dataObject.members == 'object') {
            for (const [id, memberSavedMap] of Object.entries<any>(dataObject.members)) {
                const member = guild.member(id);
                if (!member) continue;
                guildData.getMemberData(member).map = new Map(Object.entries(memberSavedMap));
            }
        }
    });
}
