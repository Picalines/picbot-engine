import { Guild, GuildMember, Role } from "discord.js";
import { checkEntityType } from "../../Entity.js";
import { referenceAccess } from "./Reference.js";

export const roleAccess = referenceAccess<string, Role, GuildMember | Guild>(entity => ({
    async serialize(role) {
        return role.id;
    },

    async deserialize(id) {
        return await (checkEntityType(entity, 'member') ? entity.guild : entity).roles.fetch(id);
    },

    async isValid(role) {
        return (checkEntityType(entity, 'member') ? entity.guild : entity).id == role.guild.id;
    },
}));
