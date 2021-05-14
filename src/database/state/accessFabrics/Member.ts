import { Guild, GuildMember } from "discord.js";
import { checkEntityType } from "../../Entity.js";
import { referenceAccess } from "./Reference.js";

export const memberAccess = referenceAccess<string, GuildMember, GuildMember | Guild>(entity => ({
    async serialize(member) {
        return member.id;
    },

    async deserialize(id) {
        return (checkEntityType(entity, 'member') ? entity.guild : entity).member(id);
    },

    async isValid(member) {
        return (checkEntityType(entity, 'member') ? entity.guild : entity).id == member.guild.id;
    },
}));
