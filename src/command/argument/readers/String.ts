import { Failable } from "../../../utils";
import { ArgumentReader, ArgumentString } from "../Argument";
import { parsedRegexReader, regexReader } from "./Regex";
import { argumentReaderTerms as readerTerms } from "./Terms";

/**
 * Читает пробелы между аргументами
 */
export const spaceReader = regexReader(/\s*/);

/**
 * Читает слово (последовательность символов до пробела)
 */
export const wordReader: ArgumentReader<string> = regexReader(/\S+/);

/**
 * Читает оставшийся текст сообщения
 */
export const remainingTextReader: ArgumentReader<string> = (userInput, context) => {
    userInput = userInput.trim();
    if (!userInput) {
        return { isError: true, error: context.translate(readerTerms).notFound };
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
        throw new Error(`keyword in ${keywordReader.name} should not include spaces`);
    }
    return (userInput, context) => {
        const wordResult = wordReader(userInput, context) as Failable<ArgumentString<W>, string>;
        if (wordResult.isError || !(keywords as string[]).includes(wordResult.value.parsedValue)) {
            return {
                isError: true,
                error: context.translate(readerTerms).keywordExpected({ keywordList: keywords.join(', ') }),
            };
        }
        return wordResult;
    };
}

/**
 * Читает строку в кавычках
 */
export const stringReader = parsedRegexReader(/(['"]).*?\1/, s => ({ isError: false, value: s.slice(1, s.length - 2) }));
