import { ValueParser } from "../../utils/index.js";
import { CommandContext } from "../Context.js";

export interface ArgumentString<T> {
    readonly length: number;
    readonly parsedValue: T;
}

export type ArgumentReader<T> = ValueParser<string, ArgumentString<T>, CommandContext<unknown[]>, string>;

export type ArgsDefinitions<Args extends unknown[]> = { readonly [K in keyof Args]: CommandArgument<Args[K]> };

export interface CommandArgument<T> {
    readonly description: string;
    readonly reader: ArgumentReader<T>;
}
