import { Guild, GuildEmoji, GuildMember } from "discord.js";
import { checkEntityType } from "../../Entity.js";
import { referenceAccess } from "./Reference.js";

/**
 * @param allowExternal default is false
 */
export const customEmojiAccess = (allowExternal = false) => referenceAccess<string, GuildEmoji, GuildMember | Guild>(entity => ({
    async serialize(emoji) {
        return emoji.id;
    },

    async deserialize(id) {
        return (checkEntityType(entity, 'member') ? entity.guild : entity).client.emojis.cache.get(id) ?? null;
    },

    async isValid(emoji) {
        return allowExternal || (checkEntityType(entity, 'member') ? entity.guild : entity).id == emoji.guild.id;
    },
}));
