import { join } from "path";
import { mkdirSync, writeFileSync, existsSync, readFileSync, unlinkSync } from "fs";
import { Guild } from "discord.js";
import { JsonDatabaseValueStorage } from "./ValueStorage";
import { BotDatabaseHandler } from "../Handler";
import { BotDatabase } from "../BotDatabase";
import { Entity, EntityType } from "../Entity";
import { Property, PropertyAccess } from "../property";

interface JsonHandlerOptions {
    databasePath: string,
    jsonIndent?: number,
}

export class JsonDatabaseHandler extends BotDatabaseHandler {
    private readonly guildsPath: string;

    constructor(readonly options: JsonHandlerOptions) {
        super(JsonDatabaseValueStorage);
        this.guildsPath = './' + join(options.databasePath, 'guilds/');
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

        const properties = [...database.cache.properties.values()];

        const setPropsObject = async <E extends EntityType>(entityType: E, entity: Entity<E>, obj: any) => {
            const entityProps = properties.filter(p => p.entityType == entityType && p.key in obj);
            await Promise.all(entityProps.map(p => database.accessProperty(entity, p).set(obj[p.key])));
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

        const getValues = async <E extends EntityType>(props: Property<E, any, PropertyAccess<any>>[], entity: Entity<E>) => {
            const vPromises = props.map<Promise<[string, any]>>(async p => [
                p.key, await database.accessProperty(entity, p).rawValue(),
            ]);
            return (await Promise.all(vPromises)).filter(v => v[1] != undefined);
        }

        const saveValues = async <E extends EntityType>(entityType: E, props: Property<E, any, PropertyAccess<any>>[], entity: Entity<E>) => {
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

        const properties = [...database.cache.properties.values()];

        const guildDefinedProps = properties.filter(p => p.entityType == 'guild');
        await saveValues('guild', guildDefinedProps, guild);

        const memberDefinedProps = properties.filter(p => p.entityType == 'member');
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
