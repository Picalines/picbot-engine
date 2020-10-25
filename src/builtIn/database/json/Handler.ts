import { mkdirSync, writeFileSync, existsSync, readFileSync, unlinkSync } from "fs";
import { BotDatabaseHandler } from "../../../database/Handler";
import { join, resolve } from "path";
import { Guild } from "discord.js";
import { JsonDatabaseValueStorage } from "./ValueStorage";
import { BotDatabase } from "../../../database/BotDatabase";
import { Property } from "../../../database/Property/Definition";
import { Entity, WidenEntity } from "../../../database/Entity";
import { PropertyAccess } from "../../../database/Property/Access";

interface JsonHandlerOptions {
    /**
     * Путь до папки базы данных бота
     */
    rootFolderPath: string,
    /**
     * Путь до папки с данными серверов в папке базы данных бота
     */
    guildsPath: string,
    /**
     * Количество отступов в json файлах
     * @default 0
     */
    jsonIndent?: number,
}

/**
 * Обработчик json базы данных
 */
export class JsonDatabaseHandler implements BotDatabaseHandler {
    /**
     * Путь до папки с данными серверов в папке базы данных бота
     */
    readonly guildsPath: string;

    readonly guildPropertyStorageClass = JsonDatabaseValueStorage as any;
    readonly memberPropertyStorageClass = JsonDatabaseValueStorage as any;

    /**
     * @param options настройки базы данных
     */
    constructor(
        public readonly options: JsonHandlerOptions
    ) {
        this.guildsPath = resolve(join('.', options.rootFolderPath, options.guildsPath));
    }

    prepareForLoading() { mkdirSync(this.guildsPath, { recursive: true }); }
    prepareForSaving() { this.prepareForLoading(); }

    async loadGuild(database: BotDatabase, guild: Guild) {
        const path = this.guildPath(guild);
        if (!existsSync(path)) return;

        const dataObject = JSON.parse(readFileSync(path).toString());

        if (dataObject.properties === undefined) {
            dataObject.properties = {};
        }

        if (dataObject.prefixes instanceof Array) {
            dataObject.properties.prefixes = dataObject.prefixes;
        }

        const setPropsObject = async <E extends Entity>(entityType: E, entity: WidenEntity<E>, obj: any) => {
            const properties = database.definedProperties.list(entityType).filter(p => p.key in obj);
            await Promise.all(properties.map(p => database.accessProperty(entity, p).set(obj[p.key])));
        }

        if (typeof dataObject.properties == 'object') {
            await setPropsObject('guild', guild, dataObject.properties);
        }

        if (typeof dataObject.members == 'object') {
            const members = Object.keys(dataObject.members).map(id => guild.member(id)!).filter(m => m != null);
            await Promise.all(members.map(m => setPropsObject('member', m, dataObject.members[m.id])));
        }
    }

    async saveGuild(database: BotDatabase, guild: Guild) {
        const jsonObject = {
            properties: {} as Record<string, any>,
            members: {} as Record<string, Record<string, any>>,
        };

        const getValues = async <E extends Entity>(props: Property<E, any, PropertyAccess<any>>[], entity: WidenEntity<E>) => {
            const vPromises = props.map<Promise<[string, any]>>(async p => [
                p.key, await database.accessProperty(entity, p).rawValue(),
            ]);
            return (await Promise.all(vPromises)).filter(v => v[1] != undefined);
        }

        const saveValues = async <E extends Entity>(entityType: E, props: Property<E, any, PropertyAccess<any>>[], entity: WidenEntity<E>) => {
            const values = await getValues(props, entity);
            if (!values.length) return;
            if (entityType == 'guild') {
                values.forEach(([key, value]) => jsonObject.properties[key] = value);
            }
            else {
                jsonObject.members[entity.id] = {};
                values.forEach(([key, value]) => jsonObject.members[entity.id][key] = value);
            }
        }

        const guildDefinedProps = database.definedProperties.list('guild');
        await saveValues('guild', guildDefinedProps, guild);

        const memberDefinedProps = database.definedProperties.list('member');
        const { cache: members } = guild.members;
        await Promise.all(members.map(member => saveValues('member', memberDefinedProps, member)));

        const json = JSON.stringify(jsonObject, null, this.options.jsonIndent);
        writeFileSync(this.guildPath(guild), json);
    }

    onGuildDelete(_: BotDatabase, guild: Guild) {
        const path = this.guildPath(guild);
        if (existsSync(path)) {
            unlinkSync(path);
        }
    }

    private guildPath(guild: Guild) {
        return join(this.guildsPath, guild.id + '.json');
    }
}
