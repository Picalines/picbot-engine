import { Guild, GuildMember } from "discord.js";
import { checkEntityType } from "../../Entity.js";
import { referenceAccess } from "./Reference.js";

export const guildAccess = () => referenceAccess<string, Guild, GuildMember | Guild>(entity => ({
    async serialize(guild) {
        return guild.id;
    },

    async deserialize(id) {
        return (checkEntityType(entity, 'member') ? entity.guild : entity).client.guilds.cache.get(id) ?? null;
    },

    async isValid() {
        return true;
    },
}));
