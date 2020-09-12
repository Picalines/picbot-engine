import { GuildMember } from "discord.js";
import { GuildData } from "./Guild";
import { DatabasePropertyMap } from "./PropertyMap";

export class GuildMemberData {
    /**
     * Свойства участника сервера
     */
    public readonly properties: DatabasePropertyMap;

    /**
     * @param guildData ссылка на данные сервера
     * @param member участник сервера
     */
    constructor(
        public readonly guildData: GuildData,
        public readonly member: GuildMember,
    ) {
        this.properties = new this.database.handler.memberDataClass();
    }

    /**
     * @returns ссылка на базу данных
     */
    get database() {
        return this.guildData.database;
    }
}
