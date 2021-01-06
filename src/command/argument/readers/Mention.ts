import { CommandContext } from "../../Context";
import { ArgumentReader } from "../Argument";
import { parsedRegexReader } from "./Regex";
import { argumentReaderTerms as readerTerms } from "./Terms";

type MentionGetter<T> = (context: CommandContext<unknown[]>, id: string) => T | null | undefined;

export const mentionReader = <T>(mentionRegex: RegExp, getter: MentionGetter<T>): ArgumentReader<T> => parsedRegexReader(mentionRegex, (mention, context) => {
    const id = mention.match(/\d+/)?.[0];
    let mentioned: T | null | undefined;
    if (!(id && (mentioned = getter(context, id)))) {
        return {
            isError: true,
            error: context.translate(readerTerms).notFound,
        };
    }
    return { isError: false, value: mentioned };
});

export const memberReader = mentionReader(/<@!?\d+>/, ({ message }, id) => message.guild.member(id));

export const roleReader = mentionReader(/<@&\d+>/, ({ message: { guild: { roles } } }, id) => roles.cache.find(r => r.id == id));

export const textChannelReader = mentionReader(/<#(?<id>\d+)>/, ({ message: { guild: { channels } } }, id) => channels.cache.find(ch => ch.type == 'text' && ch.id == id));
