import { Guild, GuildManager, GuildMember, GuildMemberManager, User, UserManager } from "discord.js";

export type EntityType = "user" | "guild" | "member";

export type Entity<E extends EntityType> = {
    "user": User,
    "guild": Guild,
    "member": GuildMember,
}[E];

export type AnyEntity = Entity<EntityType>;

export type EntityManager<E extends EntityType> = {
    "user": UserManager,
    "guild": GuildManager,
    "member": GuildMemberManager,
}[E];

export function checkEntityType<E extends EntityType>(entity: Entity<any>, expectedType: E): entity is Entity<E> {
    switch (expectedType) {
        case 'user': return 'username' in entity;
        case 'member': return 'nickname' in entity;
        case 'guild': return 'large' in entity;
    }
    return false;
}
