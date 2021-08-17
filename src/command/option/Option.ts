import { NonEmpty } from "../../utils/index.js";
import { OptionType } from "./OptionType.js";

type BaseOptionInfo = Readonly<{
    name: string;
    description: string;
}>;

type OptionChoice<T extends number | string> = Readonly<{
    name: string;
    value: T;
}>;

type StrOrIntOption = BaseOptionInfo & Readonly<
    {
        type: OptionType.String,
        choices?: Readonly<NonEmpty<OptionChoice<string>[]>>;
    }
    | {
        type: OptionType.Integer | OptionType.Number,
        choices?: Readonly<NonEmpty<OptionChoice<number>[]>>;
    }
>;

type BooleanOption = BaseOptionInfo & Readonly<{
    type: OptionType.Boolean;
}>;

type MentionableOption = BaseOptionInfo & Readonly<{
    type: OptionType.User | OptionType.Channel | OptionType.Role | OptionType.Mentionable;
}>;

type ValueOption = (StrOrIntOption | BooleanOption | MentionableOption) & {
    required?: boolean;
};

type SubCommandOption = BaseOptionInfo & Readonly<{
    type: OptionType.SubCommand;
    options?: Readonly<NonEmpty<ValueOption[]>>;
}>;

type SubCommandGroupOption = BaseOptionInfo & Readonly<{
    type: OptionType.SubCommandGroup;
    options: Readonly<NonEmpty<SubCommandOption[]>>;
}>;

type Option = Readonly<
    BaseOptionInfo
    & (ValueOption | SubCommandOption | SubCommandGroupOption)
>;

export type CommandOptions = Readonly<NonEmpty<Option[]>>;
