import { BitFieldResolvable, GuildMember, Permissions, PermissionString } from "discord.js";
import { assert, GuildMessage, Overwrite, PromiseVoid, Indexes, NonEmpty } from "../utils/index.js";
import { CommandContext } from "./Context.js";
import { Bot } from "../bot/index.js";
import { TermCollection } from "../translator/index.js";
import { ArgumentSequence } from "./argument/index.js";

interface CommandExecuteable<Args extends unknown[]> {
    (context: CommandContext<Args>): PromiseVoid;
}

export interface CommandInfo<Args extends unknown[]> {
    readonly name: string;
    readonly aliases?: Readonly<NonEmpty<string[]>>;
    readonly arguments?: ArgumentSequence<Args>;
    readonly permissions: Permissions;
}

interface CommandInfoArgument<Args extends unknown[]> {
    readonly description: string;
    readonly group: string;
    readonly tutorial: string;
    readonly permissions?: BitFieldResolvable<PermissionString>;
    readonly execute: CommandExecuteable<Args>;
}

export interface Command<Args extends unknown[]> extends CommandInfo<Args> { }

export class Command<Args extends unknown[]> {
    readonly executeable: CommandExecuteable<Args>;

    readonly infoTerms: TermCollection<{
        readonly [I in "description" | "group" | "tutorial" | `argument_${Indexes<Args>}_description`]: []
    }>;

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
            argTerms[`argument_${index}_description`] = [description];
        });

        this.infoTerms = new TermCollection({
            description: [info.description],
            group: [info.group],
            tutorial: [info.tutorial],
            ...argTerms,
        });

        for (const name of [this.name, ...(this.aliases ?? [])]) {
            assert(name && !name.includes(' ') && name == name.toLowerCase(), `invalid command name or alias '${name}'`);
        }

        Object.freeze(this);
    }

    canBeExecutedBy(member: GuildMember): boolean {
        return !member.permissions.missing(this.permissions.bitfield).length;
    }

    async execute(bot: Bot, message: GuildMessage): Promise<CommandContext<Args>> {
        assert(this.canBeExecutedBy(message.member), message.member.displayName + ` can\`t run command '${this.name}'`);

        const locale = await bot.options.fetchLocale(bot, message.guild);

        const context = new CommandContext(this, bot, message, locale);
        await this.executeable.call(this, context);

        return context;
    }
}
