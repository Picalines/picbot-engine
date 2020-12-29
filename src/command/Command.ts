import { BitFieldResolvable, GuildMember, Permissions, PermissionString } from "discord.js";
import { assert, GuildMessage, NonEmptyReadonly, Overwrite, PromiseVoid } from "../utils";
import { CommandContext } from "./Context";
import { Bot } from "../bot";
import { constTerm, TermCollection } from "../translator";
import { ArgumentSequence } from "./argument";

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
    readonly arguments?: ArgumentSequence<Args>;

    /**
     * Права участника сервера
     */
    readonly permissions: Permissions;
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
     * Описание команды
     */
    readonly description: string;

    /**
     * Группа, к которой принадлежит команда
     */
    readonly group: string;

    /**
     * Как пользоваться командой
     */
    readonly tutorial: string;

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
    readonly executeable: CommandExecuteable<Args>;

    /**
     * Термины команды для переводчика
     */
    readonly terms: TermCollection<{ description: {}, group: {}, tutorial: {} }>;

    /**
     * @param definition информация о команде
     */
    constructor(definition: Overwrite<CommandInfo<Args>, CommandInfoArgument<Args>>) {
        const { execute: executeable, permissions, name, aliases, arguments: args, ...info } = definition;

        const frozenPermissions = new Permissions(permissions);
        frozenPermissions.freeze();

        Object.assign(this, {
            name,
            aliases,
            arguments: args,
            permissions: frozenPermissions,
        });

        this.executeable = executeable;

        this.terms = new TermCollection({
            description: constTerm(info.description),
            group: constTerm(info.group),
            tutorial: constTerm(info.tutorial),
        });

        const namesToValidate = [this.name];
        if (this.aliases) {
            namesToValidate.push(...this.aliases);
        }

        for (const name of namesToValidate) {
            assert(Command.validateName(name), `invalid command name or alias '${name}'`);
        }
    }

    /**
     * @returns true, если участник сервера может использовать команду
     */
    canBeExecutedBy(member: GuildMember): boolean {
        return !member.permissions.missing(this.permissions.bitfield).length;
    }

    /**
     * Запускает команду
     * @param bot ссылка на бота
     * @param message сообщение, которое запускает команду
     */
    async execute(bot: Bot, message: GuildMessage): Promise<CommandContext<Args>> {
        assert(this.canBeExecutedBy(message.member), message.member.displayName + ` can\`t run command '${this.name}'`);

        const locale = await bot.options.fetchLocale(bot, message.guild);

        const context = new CommandContext(this, bot, message, locale);
        await this.executeable.call(this, context);

        return context;
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
