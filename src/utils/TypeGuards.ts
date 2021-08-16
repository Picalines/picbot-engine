import { Message, Guild, GuildMember, TextChannel } from "discord.js";

export function assert(condition: any, message = "assertion failed"): asserts condition {
    if (!condition) {
        throw new Error(message);
    }
}

export type GuildMessage = Message & {
    guild: Guild & { me: GuildMember & { bot: true } },
    channel: TextChannel,
    member: GuildMember,
};

export function isGuildMessage(message: Message): message is GuildMessage {
    return message.channel.type == 'GUILD_TEXT'
        && message.member != undefined
        && message.guild != undefined
        && message.guild.me != undefined
}
