import { Failable, GuildMessage } from "../../utils";

/**
 * Информация прочитанного аргумента
 */
export type ArgumentInfo<T> = {
    /**
     * Длина строки аргумента
     */
    length: number,
    /**
     * Переведённое значение аргумента
     * (числовой аргумент -> значение типа number)
     */
    parsedValue?: T,
}

/**
 * Ошибка чтения аргумента
 */
export type ArgumentReaderError = 'notFound' | { message: string };

/**
 * Интерфейс функции, читающей аргумент
 */
export interface ArgumentReader<T> {
    /**
     * @param userInput не прочитанный ввод пользователя
     * @param message сообщение пользователя
     */
    (userInput: string, message: GuildMessage): Failable<ArgumentInfo<T>, ArgumentReaderError>;
}

/**
 * Читает оставшийся текст сообщения
 */
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

/**
 * Вспомогательная функция. Читает регулярное выражение в сообщении.
 * @returns прочитанная часть, либо пустая строка
 * @param regex регулярное выражение
 * @param userInput ввод пользователя
 */
export function ReadRegex(regex: string, userInput: string): string {
    const regexp = new RegExp('^' + regex, 'i');
    const matches = userInput.match(regexp);
    return matches && matches[0] ? matches[0] : '';
}

/**
 * Читает слово (последовательность символов до пробела)
 */
export const ReadWord: ArgumentReader<string> = function (userInput) {
    const word = ReadRegex('\\S+', userInput);
    if (word) {
        return { isError: false, value: { length: word.length, parsedValue: word } };
    }
    return { isError: true, error: 'notFound' };
}

/**
 * Читает пробелы между аргументами
 */
export const ReadSpace: ArgumentReader<string> = function (userInput) {
    const spaceLength = ReadRegex('\\s*', userInput).length;
    if (spaceLength > 0) {
        return { isError: false, value: { length: spaceLength } };
    }
    return { isError: true, error: 'notFound' };
}

/**
 * Читает число (целое / дробное, положительное / отрицательное)
 */
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

/**
 * Вспомогательная функция. Возвращает новую функцию, читающую упоминание дискорда
 * @param mentionRegex регулярное выражение дискорда
 * @param getById функция, получающая упомянутый объект по его id
 */
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

/**
 * Читает упоминание участника сервера
 */
export const ReadMember = MakeMentionReader('<@!?\\d+>', (msg, id) => msg.guild.member(id));

/**
 * Читает упоминание роли
 */
export const ReadRole = MakeMentionReader('<@&\\d+>', (msg, id) => {
    return msg.guild.roles.cache.find(r => r.id == id);
});

/**
 * Читает упоминание текстового канала
 */
export const ReadTextChannel = MakeMentionReader('<#(?<id>\\d+)>', (msg, id) => {
    return msg.guild.channels.cache.find(ch => ch.type == 'text' && ch.id == id) as any;
});
