import { ReadOnlyNonEmptyArray, PromiseVoid } from "../utils";
import { PermissionString } from "discord.js";
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
     * Группа, к которой принадлежит команда
     */
    readonly group?: string;

    /**
     * Описание
     */
    readonly description?: string;
    
    /**
     * Синтаксис
     */
    readonly syntax?: string;

    /**
     * Примеры использования
     */
    readonly examples?: ReadOnlyNonEmptyArray<string>;

    /**
     * Права участника сервера
     */
    readonly permissions?: Readonly<PermissionString[]>;
}

/**
 * Интерфейс функции запуска команды
 */
export type CommandExecuteable = (context: CommandContext) => PromiseVoid;

/**
 * Функция запуска команды вместе с её информацией
 */
export interface Command extends CommandInfo {
    execute: CommandExecuteable;
}
