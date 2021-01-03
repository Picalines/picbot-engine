import { constTerm, TermCollection, TranslationCollection } from "../../../translator";
import { parseInterval } from "../../../utils";

/**
 * Термины встроенных читателей аргументов
 */
export const argumentReaderTerms = new TermCollection({
    notFound: constTerm('not found'),

    errorInArgument: {
        context: { index: Number, error: String },
        translation: ({ index, error }) => `error in argument #${index + 1}: ${error}`
    },

    errorInItem: {
        context: { index: Number, error: String },
        translation: ({ index, error }) => `error in item #${index + 1}: ${error}`
    },

    atLeastNItemsExpected: {
        context: { count: Number },
        translation: ({ count }) => `at least ${count} items expected`
    },

    keywordExpected: {
        context: { keywordList: String },
        translation: ({ keywordList }) => `one of keywords expected: ${keywordList}`,
    },

    numberIsNotInRange: {
        context: { number: Number, min: Number, max: Number },
        translation: ({ number, min, max }) => `${number} is not in range ${parseInterval(min, max)}`,
    },
});

export const argumentReaderTermTranslationRU = new TranslationCollection({
    terms: argumentReaderTerms,
    locale: 'ru',
    translations: {
        notFound: 'не найдено',
        errorInArgument: ({ index, error }) => `ошибка в аргументе #${index + 1}: ${error}`,
        errorInItem: ({ index, error }) => `ошибка в элементе #${index + 1}: ${error}`,
        atLeastNItemsExpected: ({ count }) => `ожидалось как минимум ${count} элементов(а)`,
        keywordExpected: ({ keywordList }) => `ожидалось одно из ключевых слов: ${keywordList}`,
        numberIsNotInRange: ({ number, min, max }) => `${number} не принадлежит интервалу ${parseInterval(min, max)}`,
    },
});
