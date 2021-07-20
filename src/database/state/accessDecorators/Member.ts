import { GuildMember } from "discord.js";
import { checkEntityType } from "../../Entity.js";
import { referenceAccess } from "./Reference.js";

export const memberAccess = referenceAccess<'member' | 'guild', string, GuildMember>(entity => ({
    async serialize(member) {
        return member.id;
    },

    async deserialize(id) {
        return (checkEntityType(entity, 'member') ? entity.guild : entity).members.cache.get(id) ?? null;
    },

    async isValid(member) {
        return (checkEntityType(entity, 'member') ? entity.guild : entity).id == member.guild.id;
    },
}));
