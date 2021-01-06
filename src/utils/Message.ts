import { Message, Guild, GuildMember, TextChannel } from "discord.js";

export type GuildMessage = Message & {
    guild: Guild & { me: GuildMember & { bot: true } },
    channel: TextChannel,
    member: GuildMember,
};

export function isGuildMessage(message: Message): message is GuildMessage {
    return message.channel.type == 'text'
        && message.member != undefined
        && message.guild != undefined
        && message.guild.me != undefined
}
