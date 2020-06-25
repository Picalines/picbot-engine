import { GuildMessage, Failable } from "../../utils";

export type ArgumentInfo<T> = {
    length: number,
    parsedValue?: T,
}

export type ArgumentReaderError = 'notFound' | { message: string };

export interface ArgumentReader<T> {
    (userInput: string, message: GuildMessage): Failable<ArgumentInfo<T>, ArgumentReaderError>;
}

export const ReadRemainingText: ArgumentReader<string> = function (userInput) {
    userInput = userInput.trim();
    return {
        isError: false,
        value: {
            length: userInput.length,
            parsedValue: userInput,
        },
    };
}

export function ReadRegex(regex: string, userInput: string): string {
    const regexp = new RegExp('^' + regex, 'i');
    const matches = userInput.match(regexp);
    return matches && matches[0] ? matches[0] : '';
}

export const ReadSpace: ArgumentReader<string> = function (userInput) {
    const spaceLength = ReadRegex('\\s*', userInput).length;
    if (spaceLength > 0) {
        return { isError: false, value: { length: spaceLength } };
    }
    else {
        return { isError: true, error: 'notFound' };
    }
}

export const ReadNumber: ArgumentReader<number> = function (userInput) {
    const numberInput = ReadRegex(`[+-]?\\d+(\\.\\d+)?`, userInput);
    if (!numberInput) {
        return {
            isError: true,
            error: 'notFound',
        };
    }
    const number = parseFloat(numberInput);
    if (isNaN(number)) {
        return {
            isError: true,
            error: {
                message: `'${numberInput}' is not a number`,
            },
        }
    }
    return {
        isError: false,
        value: {
            length: numberInput.length,
            parsedValue: number,
        },
    };
}

export const MakeMentionReader = <T>(
    mentionRegex: string,
    getById: (msg: GuildMessage, id: string) => T | null | undefined
): ArgumentReader<T> => (userInput, message) => {
    const mention = ReadRegex(mentionRegex, userInput);
    if (!mention) {
        return {
            isError: true,
            error: 'notFound',
        };
    }
    const idMatches = mention.match(/\d+/);
    if (!idMatches) {
        return {
            isError: true, error: { message: 'id not found in the mention' }
        };
    }
    let mentionedObj: T | null | undefined;
    try {
        mentionedObj = getById(message, idMatches[0]);
        if (!mentionedObj) {
            throw { message: 'mentioned object not found' };
        }
    }
    catch (err) {
        return {
            isError: true, error: err,
        };
    }
    return {
        isError: false,
        value: {
            length: mention.length,
            parsedValue: mentionedObj,
        }
    };
};

export const ReadMember = MakeMentionReader('<@\\!?\\d+>', (msg, id) => msg.guild.member(id));

export const ReadRole = MakeMentionReader('<@&\\d+>', (msg, id) => {
    return msg.guild.roles.cache.find(r => r.id == id);
});

export const ReadTextChannel = MakeMentionReader('<#(?<id>\\d+)>', (msg, id) => {
    return msg.guild.channels.cache.find(ch => ch.type == 'text' && ch.id == id) as any;
});
