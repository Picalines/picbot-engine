/// <reference lib="es2019.object" />

import { mkdirSync, writeFileSync, existsSync, readFileSync, unlinkSync } from "fs";
import { BotDatabaseHandler } from "../../database/Bot";
import { join, resolve } from "path";
import { Guild } from "discord.js";

type JsonHandlerOptions = {
    /**
     * Путь до папки базы данных бота
     */
    dirPath: string,
    /**
     * Путь до папки с данными серверов в папке базы данных бота
     */
    guildsPath: string,
    /**
     * Количество отступов в json файлах
     * @default 0
     */
    jsonIndent?: number,
};

/**
 * Возвращает json обработчик базы данных. Хранит данные серверов в json файлах из отдельной папки
 * @param options настройки обработчика
 */
export function getJsonBotDatabaseHandler(options: JsonHandlerOptions): BotDatabaseHandler {
    const guildsPath = resolve(join('.', options.dirPath, options.guildsPath));

    const makeGuildsFolder = () => void mkdirSync(guildsPath, { recursive: true });

    const getGuildPath = (guild: Guild) => join(guildsPath, guild.id + '.json');

    return {
        beforeLoad: makeGuildsFolder,
        beforeSave: makeGuildsFolder,

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
        },

        guildDelete: (guildData) => {
            const path = getGuildPath(guildData.guild);
            if (existsSync(path)) {
                unlinkSync(path);
            }
        }
    };
}
