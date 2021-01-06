import { Guild, GuildMember } from "discord.js";

export type EntityType = 'guild' | 'member';

export type Entity<T extends EntityType>
    = T extends 'guild' ? Guild
    : T extends 'member' ? GuildMember
    : never;

export type AnyEntity = Entity<EntityType>;
