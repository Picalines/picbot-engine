import { PermissionString } from "discord.js";
import { ReadOnlyNonEmptyArray } from "../utils";
import { CommandArgument } from "./Command";
/**
 * Информация о команде
 */

export interface CommandInfo {
    /**
     * Имя команды
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
    readonly arguments?: ReadOnlyNonEmptyArray<CommandArgument>;

    /**
     * Примеры использования
     */
    readonly examples?: ReadOnlyNonEmptyArray<string>;

    /**
     * Права участника сервера
     */
    readonly permissions?: Readonly<PermissionString[]>;
}
