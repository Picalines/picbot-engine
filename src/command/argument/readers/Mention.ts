import { CommandContext } from "../../Context.js";
import { ArgumentReader } from "../Argument.js";
import { parsedRegexReader } from "./Regex.js";
import { argumentReaderTerms as readerTerms } from "./terms/Terms.js";

type MentionGetter<T> = (context: CommandContext<unknown[]>, id: string) => T | null | undefined;

export const mentionReader = <T>(mentionRegex: RegExp, getter: MentionGetter<T>): ArgumentReader<T> => parsedRegexReader(mentionRegex, (mention, context) => {
    const id = mention.match(/\d+/)?.[0];

    let mentioned: T | null | undefined;

    if (!(id && (mentioned = getter(context, id)))) {
        return { isError: true, error: context.translate(readerTerms).notFound };
    }

    return { isError: false, value: mentioned };
});

export const memberReader = mentionReader(/<@!?\d+>/, ({ message }, id) => message.guild.members.cache.get(id));

export const roleReader = mentionReader(/<@&\d+>/, ({ message: { guild: { roles } } }, id) => roles.cache.find(r => r.id == id));

export const textChannelReader = mentionReader(/<#(?<id>\d+)>/, ({ message: { guild: { channels } } }, id) => channels.cache.find(ch => ch.type == 'GUILD_TEXT' && ch.id == id));
