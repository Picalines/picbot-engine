import { GuildMessage } from "../../utils";

export interface ArgumentReader<T> {
    (userInput: string, message: GuildMessage): { argumentLength: number; parsedValue?: T };
}

export const ReadRemainingText: ArgumentReader<string> = function (userInput) {
    userInput = userInput.trim();
    return {
        argumentLength: userInput.length,
        parsedValue: userInput,
    };
}

export function ReadRegex(regex: string, userInput: string): string {
    const regexp = new RegExp('^' + regex, 'i');
    const matches = userInput.match(regexp);
    return matches && matches[0] ? matches[0] : '';
}

export const ReadSpace: ArgumentReader<string> = function (userInput) {
    return {
        argumentLength: ReadRegex('\\s*', userInput).length
    };
}

export const ReadNumber: ArgumentReader<number> = function (userInput) {
    const numberInput = ReadRegex(`[+-]?\\d+(\\.\\d+)?`, userInput);
    if (!numberInput) {
        return { argumentLength: 0 };
    }
    const number = parseFloat(numberInput);
    if (isNaN(number)) {
        throw new SyntaxError(`'${numberInput}' is not a number`);
    }
    return {
        argumentLength: numberInput.length,
        parsedValue: number,
    };
}

export const MakeMentionReader = <T>(
    mentionRegex: string,
    getById: (msg: GuildMessage, id: string) => T | null | undefined
): ArgumentReader<T> => (userInput, message) => {
    const mention = ReadRegex(mentionRegex, userInput);
    if (!mention) {
        return { argumentLength: 0 };
    }
    const idMatches = mention.match(/\d+/);
    try {
        if (idMatches) {
            const mentionedObj = getById(message, idMatches[0]);
            if (mentionedObj) {
                return {
                    argumentLength: mention.length,
                    parsedValue: mentionedObj
                };
            }
        }
    }
    finally {
        throw new SyntaxError('invalid mention');
    }
};

export const ReadMember = MakeMentionReader('<@\\!?\\d+>', (msg, id) => msg.guild.member(id));

export const ReadRole = MakeMentionReader('<@&\\d+>', (msg, id) => {
    return msg.guild.roles.cache.find(r => r.id == id);
});

export const ReadTextChannel = MakeMentionReader('<#(?<id>\\d+)>', (msg, id) => {
    return msg.guild.channels.cache.find(ch => ch.type == 'text' && ch.id == id) as any;
});
