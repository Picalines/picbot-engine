/**
 * Объект, ключ которого - это имя термина, а значение - контекст термина (массив с именами аргументов)
 */
export type TermsDefinition = { readonly [termId: string]: readonly string[] };

/**
 * Коллекция терминов
 */
export class TermCollection<Terms extends TermsDefinition> {
    /**
     * @param terms объявление терминов коллекции
     */
    constructor(readonly terms: { readonly [ID in keyof Terms]: readonly [...Terms[ID]] }) { }

    /**
     * @returns true, если такой термин есть в коллекции
     */
    has(term: string): term is keyof Terms & string {
        return term in this.terms;
    }

    /**
     * Кидает исключение, если указанного термина нет в коллекции
     * @returns true, если такой термин есть в коллекции
     * @param term термин для проверки
     */
    assertHas(term: string): asserts term is keyof Terms & string {
        if (!this.has(term)) {
            throw new Error(`unkown term '${term}'`);
        }
    }

    /**
     * @returns ключи контекста термина (список имён аргументов, которые нужно передать переводчику)
     * @param term термин
     */
    contextKeys<ID extends keyof Terms & string>(term: ID): Terms[ID] {
        this.assertHas(term);
        return this.terms[term] as Terms[ID];
    }
}

/**
 * Контекст термина
 */
export type TermContext<Keys extends readonly string[]> = { readonly [ID in Keys[number]]: string };
