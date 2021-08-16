import { NonEmpty } from "../../utils/index.js";

export type OptionType =
    | "string"
    | "integer"
    | "boolean"
    | "user"
    | "channel"
    | "role"
    | "mentionable"
    | "subCommand"
    | "subCommandGroup";

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
        type: "string",
        choices?: Readonly<NonEmpty<OptionChoice<string>[]>>;
    }
    | {
        type: "integer",
        choices?: Readonly<NonEmpty<OptionChoice<number>[]>>;
    }
>;

type BooleanOption = BaseOptionInfo & Readonly<{
    type: "boolean";
}>;

type MentionableOption = BaseOptionInfo & Readonly<{
    type: "user" | "channel" | "role" | "mentionable";
}>;

type ValueOption = (StrOrIntOption | BooleanOption | MentionableOption) & {
    required?: boolean;
};

type SubCommandOption = BaseOptionInfo & Readonly<{
    type: "subCommand";
    options?: Readonly<NonEmpty<ValueOption[]>>;
}>;

type SubCommandGroupOption = BaseOptionInfo & Readonly<{
    type: "subCommandGroup";
    options: Readonly<NonEmpty<SubCommandOption[]>>;
}>;

type Option = Readonly<
    BaseOptionInfo
    & (ValueOption | SubCommandOption | SubCommandGroupOption)
>;

export type CommandOptions = Readonly<NonEmpty<Option[]>>;
