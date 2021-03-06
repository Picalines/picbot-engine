import { TranslationCollection } from "../../../../translator/index.js";
import { parseInterval } from "../../../../utils/index.js";
import { argumentReaderTerms } from "./Terms.js";

export default new TranslationCollection({
    terms: argumentReaderTerms,
    locale: 'ru',
    translations: {
        notFound: 'не найдено',
        errorInArgument: ({ index, error }) => `ошибка в аргументе #${index + 1}: ${error}`,
        errorInItem: ({ index, error }) => `ошибка в элементе #${index + 1}: ${error}`,
        atLeastNItemsExpected: ({ count }) => `ожидалось как минимум ${count} элементов(а)`,
        keywordExpected: ({ keywordList }) => `ожидалось одно из ключевых слов: ${keywordList}`,
        numberIsNotInRange: ({ number, min, max }) => `${number} не принадлежит интервалу ${parseInterval(Number(min), Number(max))}`,
    },
});
