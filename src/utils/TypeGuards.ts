import { Message, Guild, GuildMember, TextChannel, User } from "discord.js";

export function assert(condition: any, message = "assertion failed"): asserts condition {
    if (!condition) {
        throw new Error(message);
    }
}

export type GuildTextMessage = Message & {
    guild: Guild & { me: GuildMember & { user: User & { bot: true; }; }; },
    channel: TextChannel,
    member: GuildMember,
};

export function isGuildTextMessage(message: Message): message is GuildTextMessage {
    return message.channel.type == 'GUILD_TEXT'
        && message.member != null
        && message.guild != null
        && message.guild.me != null;
}
