import { TermCollection } from "../../../../translator/index.js";
import { parseInterval } from "../../../../utils/index.js";

export const argumentReaderTerms = new TermCollection({
    notFound: [[], 'not found'],

    errorInArgument: [
        ['index', 'error'],
        ({ index, error }) => `error in argument #${index + 1}: ${error}`,
    ],

    errorInItem: [
        ['index', 'error'],
        ({ index, error }) => `error in item #${index + 1}: ${error}`,
    ],

    atLeastNItemsExpected: [
        ['count'],
        ({ count }) => `at least ${count} items expected`,
    ],

    keywordExpected: [
        ['keywordList'],
        ({ keywordList }) => `one of keywords expected: ${keywordList}`,
    ],

    numberIsNotInRange: [
        ['number', 'min', 'max'],
        ({ number, min, max }) => `${number} is not in range ${parseInterval(Number(min), Number(max))}`,
    ],
});
