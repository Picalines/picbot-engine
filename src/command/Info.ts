import { ReadOnlyNonEmptyArray, PromiseVoid } from "../utils";
import { PermissionString } from "discord.js";
import { CommandContext } from "./Context";

export interface CommandInfo {
    readonly name: string;
    readonly aliases?: ReadOnlyNonEmptyArray<string>;
    readonly description?: string;
    readonly permissions?: Readonly<PermissionString[]>;
}

export type CommandExecuteable = (context: CommandContext) => PromiseVoid;

export type Command = CommandInfo & { execute: CommandExecuteable };
