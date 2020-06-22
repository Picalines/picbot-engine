import { Command, CommandExecuteable, CommandInfo } from "./Info";

type CommandRegisterData = {
    executeable: CommandExecuteable,
    info?: Omit<CommandInfo, 'name'>,
}

export class CommandStorage {
    readonly #commands = new Map<string, Command>();

    public register(name: string, { executeable, info }: CommandRegisterData) {
        const validateName = (name: string) => name.length > 0 && !name.includes(' ');

        if (!validateName(name)) {
            throw new Error(`invalid command name '${name}'`);
        }

        const command: Command = { name, execute: executeable, ...info };

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

    get all(): Command[] {
        return [...new Set(this.#commands.values())];
    }
}
