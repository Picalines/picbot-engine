import { TranslationCollection } from "./TranslationCollection.js";

export type TermsDefinition = Readonly<Record<string, readonly string[]>>;

export class TermCollection<Terms extends TermsDefinition> {
    readonly terms: Terms;
    readonly defaultTranslations: TranslationCollection<Terms>['translations'];

    constructor(terms: {
        readonly [ID in keyof Terms]: readonly [
            [...Terms[ID]],
            [] extends Terms[ID] ? string : (context: { [C in Terms[ID][number]]: any }) => string
        ]
    }) {
        this.terms = {} as any;
        this.defaultTranslations = {} as any;

        for (const id in terms) {
            const termDef = terms[id];
            (this.terms as any)[id] = termDef[0];
            (this.defaultTranslations as any)[id] = termDef[1];
        }

        Object.freeze(this.terms);
        Object.freeze(this.defaultTranslations);
        Object.freeze(this);
    }
}
