import { Permissions, PermissionString } from "discord.js";
import { NonEmptyReadonly, PromiseVoid } from "../utils";
import { CommandArgument } from "./Argument/Definition";
import { CommandContext } from "./Context";

/**
 * Информация о команде
 */
export interface CommandInfo<Args extends any[]> {
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
    readonly arguments?: [...{ [K in keyof Args]: CommandArgument<Args[K]> }];

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
    readonly permissions?: NonEmptyReadonly<PermissionString[]>;

    /**
     * Примеры использования
     */
    readonly examples?: NonEmptyReadonly<string[]>;
}

export interface Command<Args extends any[]> extends Omit<CommandInfo<Args>, 'permissions'> { }

/**
 * Объект, хранящий информацию команды и её логику
 */
export class Command<Args extends any[]> {
    /**
     * Права участника сервера (библиотека вызывает [[Permissions.freeze]]!)
     */
    readonly permissions: Permissions;

    /**
     * @param info информация о команде
     * @param execute функция, выполняющая основную логику команды
     */
    constructor(
        info: CommandInfo<Args>,
        readonly execute: (context: CommandContext<Args>) => PromiseVoid,
    ) {
        Object.assign(this, { ...info, execute });

        this.permissions = new Permissions(info.permissions);
        this.permissions.freeze();

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
     * Функция валидации имени или алиаса команды
     * @returns true, если имя команды не содержит пробелов, и все буквы в нём строчные
     * @param name имя или алиас команды
     */
    static validateName(name: string): boolean {
        return !name.includes(' ') && name.toLowerCase() == name;
    }
}

export type AnyCommand = Command<any[]>;
