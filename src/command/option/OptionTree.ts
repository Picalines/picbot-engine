import { Literal, NoInfer } from "../../utils/index.js";
import { OptionType } from "./OptionType.js";
import {
    OptionTypeOf,
    SubCommandOption, SubCommandGroupOption,
    IntegerOption, StringOption, NumberOption, BooleanOption,
    UserOption, ChannelOption, MentionableOption, RoleOption,
    ValueOption,
} from "./Option.js";

type StringLiteral<S> = Literal<string, S>;

type Save<O, Data> = Omit<O, keyof Data> & { readonly [K in keyof Data]: Data[K] };

type BaseOption = BooleanOption | UserOption | ChannelOption | RoleOption | MentionableOption;

export type CompiledBaseOption<
    O extends BaseOption,
    Name extends StringLiteral<Name>,
    Required extends boolean,
    > = Save<O, { name: Name; required: Required; type: OptionTypeOf<O>; }>;

export type CompiledOptionWithChoices<
    O extends StringOption | IntegerOption | NumberOption,
    Name extends StringLiteral<Name>,
    Required extends boolean,
    Choices extends O['choices'] = undefined,
    > = Save<O, { name: Name; required: Required; choices?: Choices; type: OptionTypeOf<O>; }>;

export type CompiledSubCommandOption<
    Name extends StringLiteral<Name>,
    Options extends readonly ValueOption[],
    > = Save<SubCommandOption, { name: Name; options: Options; required: true; type: OptionType.SubCommand; }>;

export type CompiledSubCommandGroupOption<
    Name extends StringLiteral<Name>,
    Options extends readonly SubCommandOption[],
    > = Save<SubCommandGroupOption, { name: Name; options: Options; required: true; type: OptionType.SubCommandGroup; }>;

type CreateBaseOption<O extends BaseOption> = <Name extends StringLiteral<Name>, Required extends boolean>
    (def: Omit<O, 'type'> & Readonly<{ name: Name, required: Required; }>) => CompiledBaseOption<O, NoInfer<Name>, NoInfer<Required>>;

type CreateOptionWithChoices<O extends StringOption | IntegerOption | NumberOption> = <Name extends StringLiteral<Name>, Required extends boolean, Choices extends O['choices'] = undefined>
    (def: Omit<O, 'type'> & Readonly<{ name: Name; required: Required; choices?: Choices; }>) => CompiledOptionWithChoices<O, NoInfer<Name>, NoInfer<Required>, NoInfer<Choices>>;

type CreateSubCommandOption = <Name extends StringLiteral<Name>, Options extends readonly ValueOption[]>
    (def: Omit<SubCommandOption, 'type' | 'required'> & Readonly<{ name: Name; options: [...Options]; }>) => CompiledSubCommandOption<NoInfer<Name>, NoInfer<Options>>;

type CreateSubCommandGroupOption = <Name extends StringLiteral<Name>, Options extends readonly SubCommandOption[]>
    (def: Omit<SubCommandGroupOption, 'type' | 'required'> & Readonly<{ name: Name; options: [...Options]; }>) => CompiledSubCommandGroupOption<NoInfer<Name>, NoInfer<Options>>;

export const string: CreateOptionWithChoices<StringOption> = def => ({ ...def, type: OptionType.String });

export const integer: CreateOptionWithChoices<IntegerOption> = def => ({ ...def, type: OptionType.Integer });

export const number: CreateOptionWithChoices<NumberOption> = def => ({ ...def, type: OptionType.Number });

export const boolean: CreateBaseOption<BooleanOption> = def => ({ ...def, type: OptionType.Boolean });

export const user: CreateBaseOption<UserOption> = def => ({ ...def, type: OptionType.User });

export const channel: CreateBaseOption<ChannelOption> = def => ({ ...def, type: OptionType.Channel });

export const role: CreateBaseOption<RoleOption> = def => ({ ...def, type: OptionType.Role });

export const mentionable: CreateBaseOption<MentionableOption> = def => ({ ...def, type: OptionType.Mentionable });

export const subCommand: CreateSubCommandOption = def => ({ ...def, type: OptionType.SubCommand, required: true });

export const subCommandGroup: CreateSubCommandGroupOption = def => ({ ...def, type: OptionType.SubCommandGroup, required: true });
