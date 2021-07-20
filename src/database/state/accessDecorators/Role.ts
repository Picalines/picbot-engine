import { Guild, GuildMember, Role } from "discord.js";
import { checkEntityType } from "../../Entity.js";
import { referenceAccess } from "./Reference.js";

export const roleAccess = referenceAccess<'member' | 'guild', string, Role>(entity => ({
    async serialize(role) {
        return role.id;
    },

    async deserialize(id) {
        return (checkEntityType(entity, 'member') ? entity.guild : entity).roles.cache.get(id) ?? null;
    },

    async isValid(role) {
        return (checkEntityType(entity, 'member') ? entity.guild : entity).id == role.guild.id;
    },
}));
