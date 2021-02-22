import { Guild, GuildManager, GuildMember, GuildMemberManager, User, UserManager } from "discord.js";

export type EntityType = "user" | "guild" | "member";

export type Entity<E extends EntityType>
    = E extends "user" ? User
    : E extends "guild" ? Guild
    : E extends "member" ? GuildMember
    : never;

export type EntityManager<E extends EntityType>
    = E extends "user" ? UserManager
    : E extends "guild" ? GuildManager
    : E extends "member" ? GuildMemberManager
    : never;

export function checkEntityType<E extends EntityType>(entity: Entity<any>, expectedType: E): entity is Entity<E> {
    switch (expectedType) {
        case 'user': return 'username' in entity;
        case 'member': return 'nickname' in entity;
        case 'guild': return 'large' in entity;
    }
    return false;
}
