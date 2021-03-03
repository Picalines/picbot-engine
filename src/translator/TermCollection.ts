import { TranslationCollection } from "./TranslationCollection.js";

export type TermsDefinition = Readonly<Record<string, readonly string[]>>;

export class TermCollection<Terms extends TermsDefinition> {
    readonly terms: Terms;
    readonly defaultTranslations: TranslationCollection<Terms>['translations'];

    constructor(terms: {
        [ID in keyof Terms]: ([] extends Terms[ID]
            ? readonly [string]
            : readonly [...Terms[ID], (context: { [K in Terms[ID][number]]: any }) => string])
    }) {
        this.terms = {} as any;
        this.defaultTranslations = {} as any;

        for (const id in terms) {
            const termDef = terms[id] as unknown as any[];

            if (typeof termDef[termDef.length - 1] == 'function') {
                (this.defaultTranslations as any)[id] = termDef.pop();
                (this.terms as any)[id] = termDef;
            }
            else {
                (this.defaultTranslations as any)[id] = termDef[0];
                (this.terms as any)[id] = [];
            }
        }

        console.log(this.defaultTranslations);

        Object.freeze(this.terms);
        Object.freeze(this.defaultTranslations);
        Object.freeze(this);
    }
}
