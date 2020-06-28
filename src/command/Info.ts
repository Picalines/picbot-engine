import { ReadOnlyNonEmptyArray, PromiseVoid } from "../utils";
import { PermissionResolvable } from "discord.js";
import { CommandContext } from "./Context";

/**
 * Информация о команде
 */
export interface CommandInfo {
    /**
     * Имя
     */
    readonly name: string;

    /**
     * Алиасы ("другие имена команды")
     */
    readonly aliases?: ReadOnlyNonEmptyArray<string>;

    /**
     * Описание
     */
    readonly description?: string;

    /**
     * Права участника сервера
     */
    readonly permissions?: ReadonlyArray<PermissionResolvable>;
}

/**
 * Интерфейс функции запуска команды
 */
export type CommandExecuteable = (context: CommandContext) => PromiseVoid;

/**
 * Функция запуска команды вместе с её информацией
 */
export type Command = CommandInfo & { execute: CommandExecuteable };
