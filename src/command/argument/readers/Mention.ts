import { CommandContext } from "../../Context";
import { ArgumentReader } from "../Argument";
import { parsedRegexReader } from "./Regex";
import { argumentReaderTerms as readerTerms } from "./Terms";

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
    let mentioned: T | null | undefined;
    if (!(id && (mentioned = getter(context, id)))) {
        return {
            isError: true,
            error: context.translator(readerTerms)('notFound')
        };
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
