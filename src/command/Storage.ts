import { Command, CommandExecuteable, CommandInfo } from "./Info";

type CommandOptionalInfo = Omit<CommandInfo, 'name'>;

type CommandRegisterData = {
    executeable: CommandExecuteable,
    info?: CommandOptionalInfo,
}

export class CommandStorage {
    readonly #commands = new Map<string, Command>();

    public register(name: string, data: CommandRegisterData | CommandExecuteable) {
        const validateName = (name: string) => name.length > 0 && !name.includes(' ');

        if (!validateName(name)) {
            throw new Error(`invalid command name '${name}'`);
        }

        let command: Command;
        if (typeof data == 'function') {
            command = { name, execute: data };
        }
        else {
            command = { name, execute: data.executeable, ...data.info };
        }

        this.#commands.set(name, command);

        command.aliases?.forEach(alias => {
            if (validateName(alias)) {
                this.#commands.set(alias, command);
            }
            else {
                console.warn(`invalid command alias '${alias}' (ignored)`);
            }
        });
    }

    public getByName(name: string): Command | never {
        const command = this.#commands.get(name);
        if (!command) {
            throw new Error(`command '${name}' not found`);
        }
        return command;
    }

    get all(): readonly Command[] {
        return [...new Set(this.#commands.values())];
    }
}
