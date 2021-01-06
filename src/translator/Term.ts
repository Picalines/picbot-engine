import { PrimitiveConstructor, PrimitiveInstanceType } from "../utils";

export type TermContextDefinition = { readonly [key: string]: PrimitiveConstructor };

export type TermContext<C extends TermContextDefinition> = { readonly [key in keyof C]: PrimitiveInstanceType<C[key]> };

export type TermTranslation<C extends TermContextDefinition> = {} extends C ? string : ((context: TermContext<C>) => string);

export interface TermDefinition<C extends TermContextDefinition> {
    readonly context: C;
    readonly translation: TermTranslation<C>;
}

export type TermContexts = Readonly<Record<string, TermContextDefinition>>;

/**
 * @example constTerm('error') -> { context: {}, translation: 'error' }
 */
export const constTerm = (translation: string): TermDefinition<{}> => ({ context: {}, translation });
