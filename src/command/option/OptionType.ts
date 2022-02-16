import { Channel, Role, User } from "discord.js";
import { Switch } from "../../utils/index.js";

export enum OptionType {
    SubCommand = 1,
    SubCommandGroup,
    String,
    Integer,
    Boolean,
    User,
    Channel,
    Role,
    Mentionable,
    Number,
}

export type OptionTypeToValue<O> = Switch<O, [
    [OptionType.String, string],
    [OptionType.Integer, number],
    [OptionType.Number, number],
    [OptionType.Boolean, boolean],
    [OptionType.User, User],
    [OptionType.Channel, Channel],
    [OptionType.Role, Role],
    [OptionType.Mentionable, User | Role],
    [OptionType.SubCommand, never],
    [OptionType.SubCommandGroup, never],
]>;
