import { ReadOnlyNonEmptyArray, PromiseVoid } from "../utils";
import { PermissionResolvable } from "discord.js";
import { CommandContext } from "./Context";

export interface CommandInfo {
    readonly name: string;
    readonly aliases?: ReadOnlyNonEmptyArray<string>;
    readonly description?: string;
    readonly permissions?: ReadonlyArray<PermissionResolvable>;
}

export type OptionalCommandInfo = Omit<CommandInfo, 'name'>;

export type CommandExecuteable = (context: CommandContext) => PromiseVoid;

export type Command = CommandInfo & { execute: CommandExecuteable };
