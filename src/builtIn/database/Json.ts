/// <reference lib="es2019.object" />

import { mkdirSync, writeFileSync, existsSync, readFileSync } from "fs";
import { join, resolve } from "path";
import { Guild } from "discord.js";
import { GuildData } from "../../database/Guild";
import {
    BotDatabase,
    DatabaseHandler,
    DatabaseHandlerParams,
    DatabaseEventName
} from "../../database/Bot";

export interface JsonDatabaseParams extends DatabaseHandlerParams {
    readonly dirPath: string;
    readonly guildsPath: string;
    readonly jsonIndent?: number;
}

export class JsonDatabase implements DatabaseHandler, JsonDatabaseParams {
    public readonly database!: BotDatabase;
    public readonly dirPath!: string;
    public readonly guildsPath!: string;
    public readonly jsonIndent?: number;

    #guildsPath: string;

    constructor(params: JsonDatabaseParams) {
        Object.assign(this, params);

        this.#guildsPath = resolve(join('.', this.dirPath, this.guildsPath));

        [['beforeLoad', 'loading'], ['beforeSave', 'saving']].forEach(([event, action]) => {
            this.database.on(event as DatabaseEventName, () => {
                mkdirSync(this.#guildsPath, { recursive: true });
                console.log(`${action} ${this.database.bot.username}'s database (json)...`);
            });
        });

        ['loaded', 'saved'].forEach(event => {
            this.database.on(event as DatabaseEventName, () => {
                console.log(`${this.database.bot.username}'s database successfully ${event} (json)`);
            });
        });
    }

    private getGuildPath(guild: Guild): string {
        return join(this.#guildsPath, guild.id + '.json');
    }

    saveGuild(guildData: GuildData): void {
        const saveDataObject = {
            prefixes: guildData.prefixes.list,
            members: {} as Record<string, any>,
        };
        for (const memberData of guildData.members) {
            if (!memberData.map) continue;
            const entries = memberData.map.entries();
            saveDataObject.members[memberData.member.id] = Object.fromEntries(entries);
        }
        writeFileSync(this.getGuildPath(guildData.guild), JSON.stringify(saveDataObject));

        console.log(`* guild '${guildData.guild.name}' successfully saved`);
    }

    loadGuild(guild: Guild, newGuildData: () => GuildData): void {
        const path = this.getGuildPath(guild);
        if (!existsSync(path)) return;

        const dataObject = JSON.parse(readFileSync(path).toString());
        const guildData = newGuildData();

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

        console.log(`* guild '${guild.name}' successfully loaded`);
    }
}
