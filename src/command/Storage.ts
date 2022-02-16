import { Bot } from "../bot/index.js";
import { Command } from "./Command.js";

export class CommandStorage implements Iterable<Command> {
    private readonly nameMap = new Map<string, Command>();
    private readonly aliasMap = new Map<string, Command>();

    constructor(readonly bot: Bot) {
        const addCommand = (command: Command) => {
            const assertNameCollision = (name: string) => {
                if (this.has(name)) {
                    throw new Error(`command name or alias '${name}' overlaps with another command`);
                }
            }

            assertNameCollision(command.name);
            this.nameMap.set(command.name, command);
        }

        this.bot.loadingSequence.add({
            name: 'import commands',
            task: () => this.bot.importer.forEach('commands', addCommand),
        });
    }

    get(name: string, nameOnly = false): Command | undefined {
        return this.nameMap.get(name) ?? (!nameOnly ? this.aliasMap.get(name) : undefined);
    }

    has(name: string, nameOnly = false): boolean {
        name = name.toLowerCase();
        return this.nameMap.has(name) || (!nameOnly && this.aliasMap.has(name));
    }

    get size(): number {
        return this.nameMap.size;
    }

    [Symbol.iterator]() {
        return this.nameMap.values();
    }
}
