import { Switch } from "../../utils/UsefulTypes.js";
import { OptionType } from "./OptionType.js";

export type BaseOption<T extends OptionType> = {
    readonly name: string;
    readonly description: string;
    readonly type: T;

    /** @default false */
    readonly required?: boolean;
};

type OptionChoice<T extends OptionType.Number | OptionType.Integer | OptionType.String> = {
    readonly name: string;
    readonly value: T extends OptionType.String ? string : number;
};

type OptionWithChoices<T extends OptionType.Number | OptionType.Integer | OptionType.String> = BaseOption<T> & {
    readonly choices?: readonly OptionChoice<T>[];
};

export type StringOption = OptionWithChoices<OptionType.String>;

export type IntegerOption = OptionWithChoices<OptionType.Integer>;

export type NumberOption = OptionWithChoices<OptionType.Number>;

export type BooleanOption = BaseOption<OptionType.Boolean>;

export type UserOption = BaseOption<OptionType.User>;

export type ChannelOption = BaseOption<OptionType.Channel>;

export type RoleOption = BaseOption<OptionType.Role>;

export type MentionableOption = BaseOption<OptionType.Mentionable>;

export type ValueOption = StringOption | IntegerOption | NumberOption | BooleanOption | UserOption | ChannelOption | RoleOption | MentionableOption;

export type SubCommandOption = BaseOption<OptionType.SubCommand> & {
    readonly options: readonly ValueOption[];
};

export type SubCommandGroupOption = BaseOption<OptionType.SubCommandGroup> & {
    readonly options: readonly SubCommandOption[];
};

export type CommandOptions = Readonly<[] | SubCommandOption[] | SubCommandGroupOption[] | ValueOption[]>;

export type OptionTypeOf<O> = Switch<O, [
    [StringOption, OptionType.String],
    [IntegerOption, OptionType.Integer],
    [NumberOption, OptionType.Number],
    [BooleanOption, OptionType.Boolean],
    [UserOption, OptionType.User],
    [ChannelOption, OptionType.Channel],
    [RoleOption, OptionType.Role],
    [MentionableOption, OptionType.Mentionable],
    [SubCommandOption, OptionType.SubCommand],
    [SubCommandGroupOption, OptionType.SubCommandGroup],
]>;
