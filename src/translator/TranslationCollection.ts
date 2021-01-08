import { assert } from "../utils/index.js";
import { TermContexts, TermTranslation } from "./Term.js";
import { TermCollection } from "./TermCollection.js";

export interface TranslationCollectionDefinition<Contexts extends TermContexts> {
    readonly terms: TermCollection<Contexts>;
    readonly locale: string;
    readonly translations: { readonly [K in keyof Contexts]: TermTranslation<Contexts[K]> };
}

export interface TranslationCollection<Contexts extends TermContexts> extends TranslationCollectionDefinition<Contexts> { }

export class TranslationCollection<Contexts extends TermContexts> {
    constructor(definition: TranslationCollectionDefinition<Contexts>) {
        Object.assign(this, definition);
        assert(this.locale, `invalid ${TranslationCollection.name} locale`);
    }

    override(otherTranslations: TranslationCollection<Contexts>): TranslationCollection<Contexts> {
        assert(otherTranslations.locale == this.locale && otherTranslations.terms == this.terms, `${TranslationCollection.name} objects are not compatible`);

        return new TranslationCollection({
            terms: this.terms,
            locale: this.locale,
            translations: { ...this.translations, ...otherTranslations.translations }
        });
    }
}
