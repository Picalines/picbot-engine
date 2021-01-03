import { Bot } from "../bot";
import { argumentReaderTerms, argumentReaderTermTranslationRU, helpCommand, helpEmbedTerms, helpEmbedTranslationsRU, helpInfoTranslationRU } from "../command";
import { assert, requireFolder } from "../utils";
import { TermContexts } from "./Term";
import { TermCollection } from "./TermCollection";
import { TranslationCollection } from "./TranslationCollection";

export class Translator {
    /**
     * WeakMap<Коллекция терминов, Map<Язык, Переводы терминов на Язык>>
     */
    readonly #translations = new WeakMap<TermCollection<any>, Map<string, TranslationCollection<any>>>();

    constructor(readonly bot: Bot) {
        const addTerms = (terms: TermCollection<any>) => {
            if (!this.#translations.has(terms)) {
                this.#translations.set(terms, new Map());
            }
        }

        this.bot.loadingSequence.stage('require terms', () => {
            addTerms(argumentReaderTerms);

            if (this.bot.options.useBuiltInHelpCommand) {
                addTerms(helpEmbedTerms);
                this.#translations.get(helpEmbedTerms)!.set(helpEmbedTranslationsRU.locale, helpEmbedTranslationsRU);
            }

            requireFolder(TermCollection, this.bot.options.loadingPaths.terms).forEach(([path, terms]) => {
                addTerms(terms);
                this.bot.logger.log(path);
            });
        });

        this.bot.commands.events.on('added', command => addTerms(command.terms));

        this.bot.loadingSequence.after('require commands', 'require translations', () => {

            this.#translations.get(helpCommand.terms)?.set('ru', helpInfoTranslationRU);
            this.#translations.get(argumentReaderTerms)?.set('ru', argumentReaderTermTranslationRU);

            requireFolder(TranslationCollection, this.bot.options.loadingPaths.translations).forEach(([path, translations]) => {
                this.bot.logger.log(path);

                assert(this.#translations.has(translations.terms), `${TranslationCollection.name} uses not loaded ${TermCollection.name} object`);

                const map = this.#translations.get(translations.terms)!;
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

    /**
     * @returns коллекцию переводов терминов на нужную локаль
     * @param terms коллекция терминов
     * @param toLocale локаль, на которую нужно перевести термины
     */
    translations<Contexts extends TermContexts>(terms: TermCollection<Contexts>, toLocale: string): TranslationCollection<Contexts> {
        assert(toLocale, 'invalid locale');
        assert(this.#translations.has(terms), `unkown ${TermCollection.name} object`);
        return (this.#translations.get(terms)!.get(toLocale) ?? terms.defaultTranslations) as TranslationCollection<Contexts>;
    }

    /**
     * @returns функцию-переводчик терминов на нужную локаль
     * @param terms коллекция терминов
     * @param toLocale локаль, на которую нужно переводить термины
     */
    get<Contexts extends TermContexts>(terms: TermCollection<Contexts>, toLocale: string): TranslationCollection<Contexts>['get'] {
        const collection = this.translations(terms, toLocale);
        return (term, ...context) => collection.get(term, ...context);
    }
}
