import { GuildMessage } from "../../utils";
import { ArgumentReader } from "../../command/Argument/Reader";
import { parsedRegexReader } from "./regex";

/**
 * Функция, получающая упомянутый объект по его id
 */
type MentionGetter<T> = (message: GuildMessage, id: string) => T | null | undefined;

/**
 * Читает упоминание
 * @param mentionRegex регулярное выражение дискорда
 * @param getter функция, получающая упомянутый объект по его id
 */
export const mentionReader = <T>(mentionRegex: RegExp, getter: MentionGetter<T>): ArgumentReader<T> => parsedRegexReader(mentionRegex, (mention, message) => {
    const id = mention.match(/\d+/)?.[0];
    if (!id) {
        return { isError: true, error: { message: 'id not found in mention' } };
    }
    const mentioned = getter(message, id);
    if (!mentioned) {
        return { isError: true, error: { message: 'mentioned object not found' } };
    }
    return { isError: false, value: mentioned };
});

/**
 * Читает упоминание участника сервера
 */
export const memberReader = mentionReader(/<@!?\d+>/, (message, id) => message.guild.member(id));

/**
 * Читает упоминание роли
 */
export const roleReader = mentionReader(/<@&\d+>/, ({ guild: { roles } }, id) => {
    return roles.cache.find(r => r.id == id);
});

/**
 * Читает упоминание текстового канала
 */
export const textChannelReader = mentionReader(/<#(?<id>\d+)>/, ({ guild: { channels } }, id) => {
    return channels.cache.find(ch => ch.type == 'text' && ch.id == id);
});
