/// <reference lib="es2019.object" />

import { mkdirSync, writeFileSync, existsSync, readFileSync, unlinkSync } from "fs";
import { BotDatabaseHandler } from "../../database/Handler";
import { join, resolve } from "path";
import { Guild } from "discord.js";
import { GuildData } from "../../database/Guild";

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

export class JsonDatabaseHandler implements BotDatabaseHandler {
    readonly guildsPath: string;

    constructor(
        public readonly options: JsonHandlerOptions
    ) {
        this.guildsPath = resolve(join('.', options.dirPath, options.guildsPath));
    }

    prepareForLoading() { this.makeGuildsFolder(); }
    prepareForSaving() { this.makeGuildsFolder(); }

    loadGuild(guildData: GuildData): void {
        const path = this.getGuildPath(guildData.guild);
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

        if (typeof dataObject.properties == 'object') {
            for (const [key, value] of Object.entries<any>(dataObject.properties)) {
                guildData.setProperty(key, value);
            }
        }
    }

    saveGuild(guildData: GuildData): void {
        const saveDataObject = {
            prefixes: guildData.prefixes.list,
            members: {} as Record<string, any>,
        } as any;

        if (guildData.map) {
            saveDataObject.properties = Object.fromEntries(guildData.map.entries());
        }

        for (const { member, map } of guildData.members) {
            if (!map) continue;
            saveDataObject.members[member.id] = Object.fromEntries(map.entries());
        }

        const json = JSON.stringify(saveDataObject, null, this.options.jsonIndent);
        writeFileSync(this.getGuildPath(guildData.guild), json);
    }

    onGuildDelete(guildData: GuildData) {
        const path = this.getGuildPath(guildData.guild);
        if (existsSync(path)) {
            unlinkSync(path);
        }
    }

    private makeGuildsFolder() {
        mkdirSync(this.guildsPath, { recursive: true });
    }

    private getGuildPath(guild: Guild) {
        return join(this.guildsPath, guild.id + '.json');
    }
}
