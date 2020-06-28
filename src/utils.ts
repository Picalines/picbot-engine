import { Message, Guild, TextChannel, GuildMember } from "discord.js";

export type GuildMessage = Message & {
    guild: Guild & { me: GuildMember },
    channel: TextChannel & { type: 'text' },
    member: GuildMember,
}

export type PromiseVoid = Promise<void> | void

export type StringResolvable<T> = new (str: string) => T

export type NonEmptyArray<T> = [T, ...T[]]

export type ReadOnlyNonEmptyArray<T> = Readonly<[T, ...T[]]>

export function nameof<T>(name: Extract<keyof T, string>): string {
    return name;
}

export type Failable<R, E> = {
    isError: true,
    error: E,
} | {
    isError: false,
    value: R,
}
