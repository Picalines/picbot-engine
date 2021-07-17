import { CommandContext } from "../Context.js";

export interface ArgumentString<T> {
    readonly length: number;
    readonly parsedValue: T;
}

export type Failable<R, E> = {
    isError: true,
    error: E,
} | {
    isError: false,
    value: R,
};

export interface Parser<From, To, Context, Error> {
    (value: From, context: Context): Failable<To, Error>;
}

export type ArgumentReader<T> = Parser<string, ArgumentString<T>, CommandContext<unknown[]>, string>;

export type ArgsDefinitions<Args extends unknown[]> = { readonly [K in keyof Args]: CommandArgument<Args[K]> };

export interface CommandArgument<T> {
    readonly description: string;
    readonly reader: ArgumentReader<T>;
}
