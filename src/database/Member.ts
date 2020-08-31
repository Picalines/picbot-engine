import { GuildMember } from "discord.js";
import { GuildData } from "./Guild";
import { PropertyMap } from "./PropertyMap";

export class GuildMemberData extends PropertyMap {
    constructor(
        /**
         * Ссылка на данные сервера
         */
        public readonly guildData: GuildData,
        /**
         * Участник сервера
         */
        public readonly member: GuildMember,
    ) {
        super();
    }
}