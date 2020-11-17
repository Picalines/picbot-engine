import { ArgumentReader } from "../../command/Argument/Reader";
import { parsedRegexReader } from "./regex";
import { CommandContext } from "../../command/Context";

/**
 * Функция, получающая упомянутый объект по его id
 */
type MentionGetter<T> = (context: CommandContext<unknown[]>, id: string) => T | null | undefined;

/**
 * Читает упоминание
 * @param mentionRegex регулярное выражение дискорда
 * @param getter функция, получающая упомянутый объект по его id
 */
export const mentionReader = <T>(mentionRegex: RegExp, getter: MentionGetter<T>): ArgumentReader<T> => parsedRegexReader(mentionRegex, (mention, context) => {
    const id = mention.match(/\d+/)?.[0];
    if (!id) {
        return { isError: true, error: 'id not found in mention' };
    }
    const mentioned = getter(context, id);
    if (!mentioned) {
        return { isError: true, error: 'mentioned object not found' };
    }
    return { isError: false, value: mentioned };
});

/**
 * Читает упоминание участника сервера
 */
export const memberReader = mentionReader(/<@!?\d+>/, ({ message }, id) => message.guild.member(id));

/**
 * Читает упоминание роли
 */
export const roleReader = mentionReader(/<@&\d+>/, ({ message: { guild: { roles } } }, id) => roles.cache.find(r => r.id == id));

/**
 * Читает упоминание текстового канала
 */
export const textChannelReader = mentionReader(/<#(?<id>\d+)>/, ({ message: { guild: { channels } } }, id) => channels.cache.find(ch => ch.type == 'text' && ch.id == id));
