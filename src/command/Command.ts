import { BitFieldResolvable, GuildMember, Permissions, PermissionString } from "discord.js";
import { assert, GuildMessage, Overwrite, PromiseVoid, Indexes, NonEmpty } from "../utils/index.js";
import { CommandContext } from "./Context.js";
import { Bot } from "../bot/index.js";
import { TermCollection } from "../translator/index.js";
import { ArgumentSequence } from "./argument/index.js";

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
    readonly aliases?: Readonly<NonEmpty<string[]>>;

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
    readonly infoTerms: TermCollection<{
        readonly [I in "description" | "group" | "tutorial" | `argument_${Indexes<Args>}_description`]: []
    }>;

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

        const argTerms = {} as any;
        this.arguments?.definitions.forEach(({ description }, index) => {
            argTerms[`argument_${index}_description`] = [[], description];
        });

        this.infoTerms = new TermCollection({
            description: [[], info.description],
            group: [[], info.group],
            tutorial: [[], info.tutorial],
            ...argTerms,
        });

        for (const name of [this.name, ...(this.aliases ?? [])]) {
            assert(name && !name.includes(' ') && name == name.toLowerCase(), `invalid command name or alias '${name}'`);
        }

        Object.freeze(this);
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
}
