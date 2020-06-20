import { Message, Guild, TextChannel, GuildMember } from "discord.js";

export type GuildMessage = Message & {
    guild: Guild,
    channel: TextChannel & { type: 'text' },
    member: GuildMember,
};

export type PromiseVoid = Promise<void> | void;

export type StringResolvable<T> = new (str: string) => T;
