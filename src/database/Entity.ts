import { Guild, GuildMember } from "discord.js";

/**
 * Сущность в базе данных (сервер / участник сервера)
 */
export type Entity = 'guild' | 'member';

/**
 * Разворачивает строчный тип сущности в объект
 */
export type WidenEntity<T extends Entity> =
    T extends 'guild' ? Guild
    : T extends 'member' ? GuildMember
    : never;
