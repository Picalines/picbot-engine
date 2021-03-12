import { Bot } from "../bot/index.js";
import { assert } from "../utils/index.js";
import { TermCollection, TermsDefinition } from "./TermCollection.js";
import { TranslationCollection } from "./TranslationCollection.js";

import helpInfoTranslationRu from "../command/help/InfoRu.js";
import helpEmbedTranslationsRu from "../command/help/embedTerms/Ru.js";
import commandErrorTermTranslationRu from "../command/errorTerms/Ru.js";
import argumentReaderTermTranslationRu from "../command/argument/readers/terms/Ru.js";

export class Translator {
    /**
     * WeakMap<terms, Map<locale, translations to this locale>>
     */
    readonly #translations = new WeakMap<TermCollection<any>, Map<string, TranslationCollection<any>>>();

    constructor(readonly bot: Bot) {
        const addTranslation = (translation: TranslationCollection<any>) => {
            this.termsMap(translation.terms).set(translation.locale, translation);
        }

        this.bot.loadingSequence.add({
            name: 'import translations',
            runsAfter: 'import commands',
            task: async () => {
                addTranslation(helpInfoTranslationRu);

                addTranslation(helpEmbedTranslationsRu);
                addTranslation(commandErrorTermTranslationRu);
                addTranslation(argumentReaderTermTranslationRu);

                this.bot.importer.forEach('translations', addTranslation);
            },
        });
    }

    private termsMap(terms: TermCollection<any>): Map<string, TranslationCollection<any>> {
        let map = this.#translations.get(terms);
        if (!map) {
            map = new Map();
            this.#translations.set(terms, map);
        }
        return map;
    }

    translate<Terms extends TermsDefinition>(terms: TermCollection<Terms>, locale: string) {
        const map = this.termsMap(terms);
        const collection = map.get(locale) ?? { translations: terms.defaultTranslations };
        assert(collection != null, `translation for ${TermCollection.name} object not found`);
        return collection.translations as TranslationCollection<Terms>['translations'];
    }
}
