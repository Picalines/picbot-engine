import { Message, Guild, TextChannel } from "discord.js";

export type GuildMessage = Message & { guild: Guild, channel: TextChannel & { type: 'text' } };

export type PromiseVoid = Promise<void> | void;

export type StringResolvable<T> = new (str: string) => T;
