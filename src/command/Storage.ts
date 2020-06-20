import { Command } from "./Command";

export class CommandStorage {
    private readonly _commands = new Map<string, Command>();

    public get commandsMap(): ReadonlyMap<string, Command> {
        return this._commands;
    }

    public addCommand(command: Command, replace = false) {
        if (this._commands.has(command.name) && !replace) {
            throw new Error(`command '${command.name}' already registered`);
        }
        if (!command.validateNames()) {
            throw new Error(`invalid command name or alias (there should be no spaces)`);
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
        if (typeof command == 'string') {
            command = this.getCommandByName(command);
        }

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
