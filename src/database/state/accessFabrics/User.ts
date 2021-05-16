import { User } from "discord.js";
import { AnyEntity } from "../../Entity.js";
import { referenceAccess } from "./Reference.js";

export const userAccess = referenceAccess<string, User, AnyEntity>(entity => ({
    async serialize(user) {
        return user.id;
    },

    async deserialize(id) {
        return entity.client.users.cache.get(id) ?? null;
    },
}));
