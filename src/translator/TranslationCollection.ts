import { TermCollection, TermsDefinition } from "./TermCollection.js";

interface Definition<Terms extends TermsDefinition> {
    readonly terms: TermCollection<Terms>;
    readonly locale: string;
    readonly translations: {
        readonly [ID in keyof Terms]: ([] extends Terms[ID]
            ? string
            : (context: { [C in Terms[ID][number]]: any }) => string
        );
    };
}

export interface TranslationCollection<Terms extends TermsDefinition> extends Definition<Terms> { }

export class TranslationCollection<Terms extends TermsDefinition> {
    constructor(definition: Definition<Terms>) {
        Object.assign(this, definition);
        Object.freeze(this);
    }
}
