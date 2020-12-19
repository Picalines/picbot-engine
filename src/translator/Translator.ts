import { Bot } from "../bot";
import { requireFolder } from "../utils";
import { TermsDefinition, TermCollection } from "./TermCollection";
import { TranslationCollection } from "./TranslationCollection";

export class Translator {
    /**
     * WeakMap<Коллекция терминов, Map<Язык, Переводы терминов на Язык>>
     */
    readonly #translations = new WeakMap<TermCollection<any>, Map<string, TranslationCollection<any>>>();

    constructor(readonly bot: Bot) {
        this.bot.loadingSequence.stage('load terms', () => {
            requireFolder(TermCollection, this.bot.options.loadingPaths.terms).forEach(([path, terms]) => {
                this.#translations.set(terms, new Map());
                this.bot.logger.log(path);
            });
        });

        this.bot.loadingSequence.stage('load translations', () => {
            requireFolder(TranslationCollection, this.bot.options.loadingPaths.translations).forEach(([path, translations]) => {
                if (!this.#translations.has(translations.terms)) {
                    throw new Error(`${TranslationCollection.name} uses not loaded ${TermCollection.name} object`);
                }

                const map = this.#translations.get(translations.terms)!;
                const { locale } = translations;

                if (map.has(locale)) {
                    map.set(locale, map.get(locale)!.override(translations));
                }
                else {
                    map.set(locale, translations);
                }

                this.bot.logger.log(path);
            });
        });
    }

    /**
     * @returns коллекцию переводов терминов на нужную локаль
     * @param terms коллекция терминов
     * @param toLocale локаль, на которую нужно перевести термины
     */
    translations<Terms extends TermsDefinition>(terms: TermCollection<Terms>, toLocale: string) {
        const loadedTranslations = this.#translations.get(terms)?.get(toLocale);
        if (!loadedTranslations) {
            throw new Error(`unkown ${TermCollection.name} object`);
        }

        return loadedTranslations as TranslationCollection<Terms>;
    }
}
