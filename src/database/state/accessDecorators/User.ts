import { User } from "discord.js";
import { EntityType } from "../../Entity.js";
import { referenceAccess } from "./Reference.js";

export const userAccess = referenceAccess<EntityType, string, User>(entity => ({
    async serialize(user) {
        return user.id;
    },

    async deserialize(id) {
        return entity.client.users.cache.get(id) ?? null;
    },
}));
