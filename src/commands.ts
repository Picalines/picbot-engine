import { GuildMessage, PromiseVoid } from "./utils";
import { Bot } from "./bot";

export class CommandStorage {
    private readonly _commands = new Map<string, Command>();

    public get commandsMap(): ReadonlyMap<string, Command> {
        return this._commands;
    }

    public addCommand(command: Command, replace = false) {
        if (this._commands.has(command.name) && !replace) {
            throw new Error(`command '${command.name}' already registered`);
        }
        this._commands.set(command.name, command);
        command.aliases.forEach(alias => {
            if (this._commands.has(alias)) {
                console.warn(`command alias '${alias}' was ignored because of conflict`);
            }
            else {
                this._commands.set(alias, command);
            }
        });
    }

    public removeCommand(command: Command | string) {
        if (typeof command == 'string') command = this.getCommandByName(command);
        if (!this._commands.delete(command.name)) {
            throw new Error(`command '${command}' not registered`);
        }
        command.aliases.forEach(alias => this._commands.delete(alias));
    }

    public clear() {
        return this._commands.clear();
    }

    public getCommandByName(name: string): Command | never {
        const command = this._commands.get(name);
        if (!command) {
            throw new Error(`command '${name}' not registered`);
        }
        return command;
    }
}

export class CommandHandler {
    constructor(
        public readonly bot: Bot
    ) { }

    public async handleMessage(message: GuildMessage, startFrom: number) {
        let content = message.content.slice(startFrom);

        const command = this.bot.commandStorage.getCommandByName(content.replace(/\s.*$/, ''));

        content = content.slice(command.name.length).replace(/^\s+/, '');

        await this.bot.catchErrorEmbedReply(message, () => {
            return this.executeCommand(command, content);
        });
    }

    public async executeCommand(command: Command, userInput: string) {
        console.error('not implemented');
    }
}

export abstract class Command {
    public abstract readonly name: string;
    public readonly aliases: string[] = [];
    public abstract readonly description: string;

    public abstract execute(message: GuildMessage): PromiseVoid;
}

class MathCommand extends Command {
    name = 'math';
    aliases = ['calc'];
    description = '*математика*';

    execute(message: GuildMessage) {
        
    }
}
