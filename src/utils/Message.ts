import { Message, Guild, GuildMember, TextChannel } from "discord.js";

/**
 * Сообщение в текстовом канале на сервере
 */
export type GuildMessage = Message & {
    guild: Guild & { me: GuildMember & { bot: true } },
    channel: TextChannel,
    member: GuildMember,
};

/**
 * @returns true, если сообщение пришло из сервера
 * @param message сообщение
 */
export function isGuildMessage(message: Message): message is GuildMessage {
    return message.channel.type == 'text'
        && message.channel instanceof TextChannel
        && message.member != undefined
        && message.guild != undefined
        && message.guild.me != undefined
}
