import { Bot } from "../bot/index.js";
import { argumentReaderTerms, argumentReaderTermTranslationRU, helpCommand, helpEmbedTerms, helpEmbedTranslationsRU, helpInfoTranslationRU } from "../command/index.js";
import { assert, importFolder } from "../utils/index.js";
import { TermContexts } from "./Term.js";
import { TermCollection } from "./TermCollection.js";
import { TranslationCollection } from "./TranslationCollection.js";

export class Translator {
    /**
     * WeakMap<terms, Map<locale, translations to this locale>>
     */
    readonly #translations = new WeakMap<TermCollection<any>, Map<string, TranslationCollection<any>>>();

    constructor(readonly bot: Bot) {
        this.bot.loadingSequence.after('import commands', 'import translations', async () => {
            this.termsMap(helpCommand.terms).set('ru', helpInfoTranslationRU);
            this.termsMap(helpEmbedTerms).set('ru', helpEmbedTranslationsRU);
            this.termsMap(argumentReaderTerms).set('ru', argumentReaderTermTranslationRU);

            (await importFolder(TranslationCollection, this.bot.options.loadingPaths.translations)).forEach(({ path, item: translations }) => {
                this.bot.logger.log(path);

                const map = this.termsMap(translations.terms);
                const { locale } = translations;

                if (map.has(locale)) {
                    map.set(locale, map.get(locale)!.override(translations));
                }
                else {
                    map.set(locale, translations);
                }
            });
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

    collection<Contexts extends TermContexts>(terms: TermCollection<Contexts>, toLocale: string): TranslationCollection<Contexts> {
        assert(toLocale, 'invalid locale');
        return (this.termsMap(terms).get(toLocale) ?? terms.defaultTranslations) as TranslationCollection<Contexts>;
    }

    translations<Contexts extends TermContexts>(terms: TermCollection<Contexts>, toLocale: string): TranslationCollection<Contexts>['translations'] {
        return this.collection(terms, toLocale).translations;
    }
}
