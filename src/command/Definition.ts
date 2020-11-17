import { BitFieldResolvable, Permissions, PermissionString } from "discord.js";
import { Bot } from "../Bot";
import { GuildMessage, NonEmptyReadonly, Overwrite, PromiseVoid } from "../utils";
import { CommandArgumentsReader } from "./argument/Reader";
import { CommandContext } from "./Context";

/**
 * Информация о команде
 */
export interface CommandInfo<Args extends unknown[]> {
    /**
     * Имя команды. Оно не должно содержать пробелов. Все буквы должны быть строчными.
     */
    readonly name: string;

    /**
     * Алиасы ("другие имена команды"). На алиасы распространяются те же
     * правила, что и на [[CommandInfo.name]]
     */
    readonly aliases?: NonEmptyReadonly<string[]>;

    /**
     * Аргументы команды
     */
    readonly arguments?: CommandArgumentsReader<Args>;

    /**
     * Описание команды
     */
    readonly description: string;

    /**
     * Группа, к которой принадлежит команда
     */
    readonly group?: string;

    /**
     * Права участника сервера
     */
    readonly permissions: Permissions;

    /**
     * Примеры использования
     */
    readonly examples?: NonEmptyReadonly<string[]>;
}

/**
 * Функция, выполняющая основную логику команды
 */
interface CommandExecuteable<Args extends unknown[]> {
    (context: CommandContext<Args>): PromiseVoid;
}

/**
 * Аргумент конструктора команды
 */
interface CommandInfoArgument<Args extends unknown[]> {
    /**
     * Права участника сервера (библиотека вызывает [[Permissions.freeze]]!)
     */
    readonly permissions?: BitFieldResolvable<PermissionString>;

    /**
     * Функция, выполняющая основную логику команды
     */
    readonly execute: CommandExecuteable<Args>;
}

export interface Command<Args extends unknown[]> extends CommandInfo<Args> { }

/**
 * Объект, хранящий информацию команды и её логику
 */
export class Command<Args extends unknown[]> {
    /**
     * Функция, выполняющая основную логику команды
     */
    private executeable: CommandExecuteable<Args>;

    /**
     * @param info информация о команде
     */
    constructor(info: Overwrite<CommandInfo<Args>, CommandInfoArgument<Args>>) {
        const { execute, permissions, ...docInfo } = info;

        const frozenPermissions = new Permissions(permissions);
        frozenPermissions.freeze();

        Object.assign(this, { ...docInfo, permissions: frozenPermissions });
        this.executeable = execute;

        const namesToValidate = [this.name];
        if (this.aliases) {
            namesToValidate.push(...this.aliases);
        }

        for (const name of namesToValidate) {
            if (!Command.validateName(name)) {
                throw new Error(`invalid command name or alias '${name}'`);
            }
        }
    }

    /**
     * Запускает команду
     * @param context контекст команды
     */
    async execute(bot: Bot, message: GuildMessage): Promise<void> {
        const missingPermissions = message.member.permissions.missing(this.permissions.bitfield);
        if (missingPermissions.length) {
            throw new Error(`not enough permissions`);
        }

        const context = new CommandContext(this, bot, message);
        await this.executeable.call(this, context);
    }

    /**
     * Функция валидации имени или алиаса команды
     * @returns true, если имя команды не содержит пробелов, и все буквы в нём строчные
     * @param name имя или алиас команды
     */
    static validateName(name: string): boolean {
        return !name.includes(' ') && name.toLowerCase() == name;
    }
}

export type AnyCommand = Command<any[]>;
