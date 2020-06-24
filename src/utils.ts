import { Message, Guild, TextChannel, GuildMember } from "discord.js";

export type GuildMessage = Message & {
    guild: Guild,
    channel: TextChannel & { type: 'text' },
    member: GuildMember,
};

export type PromiseVoid = Promise<void> | void;

export type StringResolvable<T> = new (str: string) => T;

export type NonEmptyArray<T> = [T, ...T[]];

export type ReadOnlyNonEmptyArray<T> = readonly [T, ...T[]];

export function nameof<T>(name: Extract<keyof T, string>): string {
    return name;
}
