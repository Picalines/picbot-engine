import { Guild, GuildMember } from "discord.js";

/**
 * Сущность в базе данных (сервер / участник сервера)
 */
export type EntityType = 'guild' | 'member';

/**
 * Разворачивает строчный тип сущности в объект
 */
export type Entity<T extends EntityType> =
    T extends 'guild' ? Guild
    : T extends 'member' ? GuildMember
    : never;
