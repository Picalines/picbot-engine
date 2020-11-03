import { ArgumentReader, ArgumentReaderError, ArgumentString } from "../../command/Argument/Reader";
import { Failable } from "../../utils";
import { parsedRegexReader, regexReader } from "./regex";

/**
 * Читает слово (последовательность символов до пробела)
 */
export const wordReader: ArgumentReader<string> = regexReader(/\S+/);

/**
 * Читает оставшийся текст сообщения
 */
export const remainingTextReader: ArgumentReader<string> = userInput => {
    userInput = userInput.trim();
    if (!userInput) {
        return { isError: true, error: 'notFound' };
    }
    return {
        isError: false,
        value: { length: userInput.length, parsedValue: userInput },
    };
}

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
 * Читает строку в кавычках
 */
export const stringReader = parsedRegexReader(/(['"]).*?\1/, s => ({ isError: false, value: s.slice(1, s.length - 2) }));
