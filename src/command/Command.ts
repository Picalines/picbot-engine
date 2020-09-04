import { PermissionString, GuildMember } from "discord.js";
import { PromiseVoid, GuildMessage } from "../utils";
import { CommandContext } from "./Context";
import { Bot } from "../Bot";
import { CommandInfo } from "./Info";

export type CommandArgument = {
    name: string;
    type: string;
    defaultInput?: string;
};

/**
 * Интерфейс функции запуска команды
 */
export type CommandExecuteable = (context: CommandContext) => PromiseVoid;

/**
 * Объект, хранящий информацию команды и её логику
 */
export class Command {
    /**
     * Регулярное выражение синтаксиса команды (используется для валидации)
     */
    public static readonly syntaxRegex = /(<\w+:\w+(?:=.*)?>\s*)+/;

    /**
     * Регулярное выражение аргумента в синтаксисе команды
     */
    public static readonly syntaxArgumentRegex = /<(?<type>\w+):(?<name>\w+)(?:(?<default>=.*?))?>/g;

    /**
     * Информация о команде
     */
    public readonly info: CommandInfo;

    /**
     * Функция, выполняющая основную логику команды
     */
    private readonly executeable: CommandExecuteable;

    /**
     * @param info информация о команде
     */
    constructor(info: CommandInfo & { execute: CommandExecuteable }) {
        const { execute, ...otherInfo } = info;

        if (!Command.validateName(otherInfo.name)) {
            throw new Error(`invalid command name '${otherInfo.name}'`);
        }

        otherInfo.aliases?.forEach(alias => {
            if (!Command.validateName(alias)) {
                throw new Error(`invalid command alias '${alias}' ('${otherInfo.name}')`);
            }
        });

        const _info = { ...otherInfo };
        if (_info.syntax) {
            _info.arguments = [...this.buildArgumentsFromSyntax(_info.name, _info.syntax)] as any;
        }

        this.info = _info;
        this.executeable = execute;
    }

    /**
     * Запускает команду
     * @param bot бот
     * @param message сообщение
     */
    public async execute(bot: Bot, message: GuildMessage): Promise<void> {
        const missingPermissions = this.getMissingPermissions(bot, message.member);
        if (missingPermissions.length) {
            throw new Error(`Not enough permissions: ${missingPermissions.join(', ')}`);
        }

        const context = new CommandContext(this, bot, message);
        await this.executeable(context);
    }

    /**
     * @returns список прав, которые отсутствуют у участника сервера для использования команды
     * @param bot бот
     * @param member участник сервера
     */
    public getMissingPermissions(bot: Bot, member: GuildMember): PermissionString[] {
        const permissions = this.info.permissions || [];
        const { checkAdmin } = bot.options.permissions;
        return member.permissions.missing(permissions, checkAdmin);
    }

    /**
     * @returns true, если у участника сервера достаточно прав, чтобы использовать команду
     * @param bot бот
     * @param member участник сервера
     */
    public hasPermissions(bot: Bot, member: GuildMember): boolean {
        return !this.getMissingPermissions(bot, member).length;
    }

    /**
     * @returns true, если имя команды не пустая строка и не содержит пробелов
     * @param name имя команды
     */
    public static validateName(name: string): boolean {
        return name.length > 0 && !name.includes(' ');
    }

    /**
     * Возвращает список аргументов команды через её синтаксис
     * @param commandName имя команды
     * @param syntax синтаксис команды
     */
    private *buildArgumentsFromSyntax(commandName: string, syntax: string): IterableIterator<CommandArgument> {
        if (!Command.syntaxRegex.test(syntax)) {
            throw new Error(`invalid '${commandName}' command syntax: ${syntax}`);
        }

        const argMatches = [...syntax.matchAll(Command.syntaxArgumentRegex)]
            .filter(m => m.groups !== undefined);

        if (!argMatches.length) {
            return;
        }

        const argNames: string[] = [];

        for (const argMatch of argMatches) {
            const { type: argType, name: argName } = argMatch.groups!;
            if (argNames.includes(argName)) {
                throw new Error(`'${commandName}' command argument name '${argName}' already used`);
            }

            argNames.push(argName);

            let defaultInput: string | undefined = undefined;
            const { default: defaultInputGroup } = argMatch.groups!;
            if (defaultInputGroup) {
                defaultInput = defaultInputGroup.slice(1);
            }

            yield { name: argName, type: argType, defaultInput };
        }
    }
}
