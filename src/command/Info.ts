import { ReadOnlyNonEmptyArray, PromiseVoid } from "../utils";
import { PermissionString } from "discord.js";
import { CommandContext } from "./Context";

export type CommandArgumentData = {
    name: string;
    type: string;
    readDefault?: (context: CommandContext) => any;
};

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
     * Пример: !ban `<member:target> <remainingText:reason=спам>`
     */
    readonly syntax?: string;

    /**
     * Аргументы команды.
     * Если это свойство указано, то в [[Command.execute]] из контекста будет доступно
     * свойство [[CommandContext.args]].
     * Это свойство заполняется автоматически, если указано свойство [[CommandInfo.syntax]]
     */
    readonly arguments?: CommandArgumentData[];

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
