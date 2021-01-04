import { assert } from "../utils";
import { TermContexts, TermTranslation } from "./Term";
import { TermCollection } from "./TermCollection";

/**
 * Объявление коллекции переводов
 */
export interface TranslationCollectionDefinition<Contexts extends TermContexts> {
    /**
     * Коллекция терминов, которую мы переводим
     */
    readonly terms: TermCollection<Contexts>;

    /**
     * Язык, на который мы переводим термины
     */
    readonly locale: string;

    /**
     * Перевод терминов
     */
    readonly translations: { readonly [K in keyof Contexts]: TermTranslation<Contexts[K]> };
}

export interface TranslationCollection<Contexts extends TermContexts> extends TranslationCollectionDefinition<Contexts> { }

/**
 * Коллекция переводов
 */
export class TranslationCollection<Contexts extends TermContexts> {
    /**
     * @param definition объявление коллекции переводов
     */
    constructor(definition: TranslationCollectionDefinition<Contexts>) {
        Object.assign(this, definition);
        assert(this.locale, `invalid ${TranslationCollection.name} locale`);
    }

    /**
     * @returns новая коллекция переводов, у которой переводы из первой (this) коллекции переписаны переводами из второй (otherTranslations). Термины и локаль сохраняются.
     * @param otherTranslations другая коллекция переводов тех же терминов на тот же язык
     */
    override(otherTranslations: TranslationCollection<Contexts>): TranslationCollection<Contexts> {
        assert(otherTranslations.locale == this.locale && otherTranslations.terms == this.terms, `${TranslationCollection.name} objects are not compatible`);

        return new TranslationCollection({
            terms: this.terms,
            locale: this.locale,
            translations: { ...this.translations, ...otherTranslations.translations }
        });
    }
}
