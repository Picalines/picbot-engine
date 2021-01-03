import { assert, Mutable } from "../utils";
import { TermDefinition, TermContexts } from "./Term";
import { TranslationCollection, TranslationCollectionDefinition } from "./TranslationCollection";

export class TermCollection<Contexts extends TermContexts> {
    /**
     * Контексты терминов
     */
    readonly contexts: Contexts;

    /**
     * Стандартные переводы терминов
     */
    readonly defaultTranslations: TranslationCollection<Contexts>;

    /**
     * @param terms термины переводчика
     */
    constructor(terms: { [K in keyof Contexts]: TermDefinition<Contexts[K]> }) {
        const contexts: Mutable<Contexts> = {} as any;
        const translations: Mutable<TranslationCollectionDefinition<Contexts>['translations']> = {} as any;

        for (const term in terms) {
            contexts[term] = terms[term].context;
            translations[term] = terms[term].translation as any;
        }

        this.contexts = contexts;

        this.defaultTranslations = new TranslationCollection({
            locale: '__default',
            terms: this,
            translations,
        });
    }

    /**
     * @returns массив имён терминов
     */
    names(): (keyof Contexts)[] {
        return Object.keys(this.contexts);
    }

    /**
     * @returns true, если такой термин есть в коллекции
     */
    has(term: string | number | symbol): term is keyof Contexts {
        return term in this.contexts;
    }

    /**
     * Кидает исключение, если указанного термина нет в коллекции
     * @returns true, если такой термин есть в коллекции
     * @param term термин для проверки
     */
    assertHas(term: string | number | symbol): asserts term is keyof Contexts {
        assert(this.has(term), `unkown term '${String(term)}'`)
    }

    /**
     * @returns ключи контекста термина (список имён аргументов, которые нужно передать переводчику)
     * @param term термин
     */
    context<K extends keyof Contexts>(term: K): Contexts[K] {
        this.assertHas(term);
        return this.contexts[term];
    }
}
