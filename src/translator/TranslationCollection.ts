import { TermCollection, TermContext, TermsDefinition } from "./TermCollection";

/**
 * Перевод термина
 */
export type TermTranslation<ContextKeys extends readonly string[]> = string | ((args: TermContext<ContextKeys>) => string);

/**
 * Объект, содержащий переводы терминов
 */
export type TranslationsDefinition<Terms extends TermsDefinition> = { [ID in keyof Terms]: TermTranslation<Terms[ID]> };

interface TranslationCollectionDefinition<Terms extends TermsDefinition> {
    /**
     * Коллекция терминов, которую мы переводим
     */
    readonly terms: TermCollection<Terms>;

    /**
     * Язык, на который мы переводим термины
     */
    readonly locale: string;

    /**
     * Перевод терминов
     */
    readonly translations: TranslationsDefinition<Terms>;
}

export interface TranslationCollection<Terms extends TermsDefinition> extends TranslationCollectionDefinition<Terms> { }

/**
 * Коллекция переводов
 */
export class TranslationCollection<Terms extends TermsDefinition> {
    constructor(definition: TranslationCollectionDefinition<Terms>) {
        Object.assign(this, definition);
    }

    /**
     * @returns перевод термина на язык коллекции с учётом контекста
     * @param term термин
     * @param context контекст термина
     */
    translate<ID extends keyof Terms & string>(term: ID, ...context: [...Terms[ID] extends [] ? [undefined?] : [TermContext<Terms[ID]>]]): string {
        this.terms.assertHas(term);

        const translator = this.translations[term] as TermTranslation<Terms[ID]>;

        if (typeof translator == 'string') {
            return translator;
        }

        const contextKeys = this.terms.contextKeys(term);

        if (!contextKeys.length) {
            return translator({} as TermContext<Terms[ID]>)
        }

        return translator(context[0] as TermContext<Terms[ID]>);
    }

    /**
     * @returns новая коллекция переводов, у которой переводы из первой (this) коллекции переписаны переводами из второй (otherTranslations). Термины и локаль сохраняются.
     * @param otherTranslations другая коллекция переводов тех же терминов на тот же язык
     */
    override(otherTranslations: TranslationCollection<Terms>): TranslationCollection<Terms> {
        if (!(otherTranslations.locale == this.locale && otherTranslations.terms == this.terms)) {
            throw new Error(`${TranslationCollection.name} objects are not compatible`);
        }

        return new TranslationCollection({
            terms: this.terms,
            locale: this.locale,
            translations: { ...this.translations, ...otherTranslations.translations }
        });
    }
}
