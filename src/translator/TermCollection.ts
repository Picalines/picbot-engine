import { assert, Mutable } from "../utils/index.js";
import { TermDefinition, TermContexts } from "./Term.js";
import { TranslationCollection, TranslationCollectionDefinition } from "./TranslationCollection.js";

type TermCollectionDefinition<Contexts extends TermContexts> = { [K in keyof Contexts]: TermDefinition<Contexts[K]> }

export class TermCollection<Contexts extends TermContexts> {
    readonly contexts: Contexts;
    readonly defaultTranslations: TranslationCollection<Contexts>;

    constructor(terms: TermCollectionDefinition<Contexts>) {
        const contexts: Mutable<Contexts> = {} as any;
        const translations: Mutable<TranslationCollectionDefinition<Contexts>['translations']> = {} as any;

        for (const term in terms) {
            const { context, translation } = terms[term];
            contexts[term] = context;
            translations[term] = translation;
        }

        this.contexts = contexts;

        this.defaultTranslations = new TranslationCollection({
            locale: '__default',
            terms: this,
            translations,
        });
    }

    names(): (keyof Contexts)[] {
        return Object.keys(this.contexts);
    }

    has(term: string | number | symbol): term is keyof Contexts {
        return term in this.contexts;
    }

    assertHas(term: string | number | symbol): asserts term is keyof Contexts {
        assert(this.has(term), `unkown term '${String(term)}'`)
    }

    context<K extends keyof Contexts>(term: K): Contexts[K] {
        this.assertHas(term);
        return this.contexts[term];
    }
}
