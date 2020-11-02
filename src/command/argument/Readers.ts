import { Failable, GuildMessage, InferPrimitive, Primitive, ValueParser } from "../../utils";

/**
 * Информация прочитанного аргумента
 */
export interface ArgumentString<T> {
    /**
     * Длина строки аргумента
     */
    length: number;
    /**
     * Переведённое значение аргумента
     */
    parsedValue: T;
}

/**
 * Ошибка чтения аргумента
 */
export type ArgumentReaderError = 'notFound' | { message: string };

/**
 * Интерфейс функции, читающей аргумент
 */
export interface ArgumentReader<T> extends ValueParser<string, ArgumentString<T>, GuildMessage, ArgumentReaderError> { }

/**
 * Читает оставшийся текст сообщения
 */
export const remainingTextReader: ArgumentReader<string> = userInput => {
    userInput = userInput.trim();
    if (!userInput) {
        return {
            isError: true,
            error: 'notFound',
        };
    }
    return {
        isError: false,
        value: { length: userInput.length, parsedValue: userInput },
    };
}

/**
 * @returns функцию, которая либо читает аргумент, либо возвращает _default, если аргумент не найден
 * @param reader функция, читающая аргумент
 */
export const optionalReader = <T, D extends T | null>(reader: ArgumentReader<T>, _default: InferPrimitive<D>): ArgumentReader<T | InferPrimitive<D>> => {
    return (userInput, message) => {
        const result = reader(userInput, message);
        if (result.isError && !userInput.length) {
            return { isError: false, value: { length: 0, parsedValue: _default } };
        }
        return result;
    };
}

/**
 * Читает аргумент по регулярному выражению
 * @param regex регулярное выражение
 */
export const regexReader = (regex: RegExp): ArgumentReader<string> => {
    if (!regex.source.startsWith('^')) {
        regex = new RegExp('^' + regex.source);
    }
    return userInput => {
        const firstMatch = userInput.match(regex)?.[0];
        if (firstMatch === undefined) {
            return { isError: true, error: 'notFound' };
        }
        return {
            isError: false,
            value: { length: firstMatch.length, parsedValue: firstMatch },
        };
    };
}

/**
 * Читает пробелы между аргументами
 */
export const spaceReader: ArgumentReader<string> = regexReader(/\s+/);

/**
 * Читает слово (последовательность символов до пробела)
 */
export const wordReader: ArgumentReader<string> = regexReader(/\S+/);

/**
 * @returns функцию, читающую одно из ключевых слов
 * @param keywords ключевые слова
 */
export const keywordReader = <W extends string>(...keywords: W[]): ArgumentReader<W> => {
    if (keywords.some(w => w.includes(' '))) {
        throw new Error('keyword in keywordReader should not include spaces');
    }
    return (userInput, message) => {
        const wordResult = wordReader(userInput, message) as Failable<ArgumentString<W>, ArgumentReaderError>;
        if (wordResult.isError || !(keywords as string[]).includes(wordResult.value.parsedValue)) {
            return {
                isError: true,
                error: { message: `one of keywords expected: ${keywords.join(', ')}` },
            };
        }
        return wordResult;
    };
}

/**
 * Читает аргумент по регулярному выражению, а затем переводит его с помощью парсера
 * @param regex регулярное выражение
 * @param parser функция парсер
 */
export const parsedRegexReader = <T>(regex: RegExp, parser: ValueParser<string, T, GuildMessage, { message: string }>): ArgumentReader<T> => {
    const reader = regexReader(regex);
    return (userInput, message) => {
        const result = reader(userInput, message);
        if (result.isError) {
            return result;
        }
        const parsed = parser(result.value.parsedValue, message);
        if (parsed.isError) {
            return parsed;
        }
        return {
            isError: false,
            value: {
                length: result.value.length,
                parsedValue: parsed.value,
            },
        };
    };
}

/**
 * Читает число (целое / дробное, положительное / отрицательное)
 */
export const numberReader = (type: 'int' | 'float', range?: [min: number, max: number]): ArgumentReader<number> => {
    const parseNumber = type == 'int' ? parseInt : parseFloat;

    let inRange: (n: number) => boolean;
    if (range) {
        inRange = n => n >= range![0] && n <= range![1];
    }
    else {
        inRange = _ => true;
        range = [-Infinity, Infinity];
    }

    return parsedRegexReader<number>(/[+-]?\d+(\.\d*)?/, numberInput => {
        const number = parseNumber(numberInput);
        if (isNaN(number)) {
            return { isError: true, error: { message: `'${numberInput}' is not a number (${type})` } };
        }
        if (!inRange(number)) {
            return { isError: true, error: { message: `${numberInput} is not in range [${range!.slice(0, 2)}]` } }
        }
        return { isError: false, value: number };
    });
};

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
