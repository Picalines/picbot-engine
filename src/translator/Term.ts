import { PrimitiveConstructor, PrimitiveInstanceType } from "../utils";

/**
 * Объявление контекста термина
 */
export type TermContext = { readonly [key: string]: PrimitiveConstructor };

/**
 * Объект со значениями контекста термина
 */
export type TermContextValues<C extends TermContext> = { readonly [key in keyof C]: PrimitiveInstanceType<C[key]> };

/**
 * Функция-переводчик термина
 */
export type TermTranslation<C extends TermContext> = (context: TermContextValues<C>) => string;

/**
 * Термин переводчика
 */
export interface TermDefinition<C extends TermContext> {
    /**
     * Контекст термина (данные из вне, которые нужны для составления строки)
     */
    readonly context: C;

    /**
     * Стандартный перевод термина
     */
    readonly translation: TermTranslation<C>;
}

export type TermContexts = Readonly<Record<string, TermContext>>;

/**
 * Сокращение для терминов, которым не нужны данные из вне (контекст - пустой объект)
 * @param translation перевод термина
 */
export function constTerm(translation: string | (() => string)): TermDefinition<{}> {
    if (typeof translation == 'string') {
        const defaultTranslation = translation;
        translation = () => defaultTranslation;
    }

    return { context: {}, translation }
}
