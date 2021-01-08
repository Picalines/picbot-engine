import { Failable } from "../../../utils/index.js";
import { ArgumentReader, ArgumentString } from "../Argument.js";
import { parsedRegexReader, regexReader } from "./Regex.js";
import { argumentReaderTerms as readerTerms } from "./Terms.js";

export const spaceReader = regexReader(/\s*/);

export const wordReader: ArgumentReader<string> = regexReader(/\S+/);

export const stringReader = parsedRegexReader(/(['"]).*?\1/, s => ({ isError: false, value: s.slice(1, s.length - 2) }));

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
