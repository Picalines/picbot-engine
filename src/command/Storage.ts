import { Bot } from "../bot/index.js";
import { importFolder } from "../utils/index.js";
import { AnyCommand, Command } from "./Command.js";
import { helpCommand } from "./help/index.js";

export class CommandStorage implements Iterable<AnyCommand> {
    private readonly nameMap = new Map<string, AnyCommand>();
    private readonly aliasMap = new Map<string, AnyCommand>();

    constructor(readonly bot: Bot) {
        const addCommand = (command: AnyCommand) => {
            const assertNameCollision = (name: string) => {
                if (this.has(name)) {
                    throw new Error(`command name or alias '${name}' overlaps with another command`);
                }
            }

            assertNameCollision(command.name);
            this.nameMap.set(command.name, command);

            command.aliases?.forEach(alias => {
                assertNameCollision(alias);
                this.aliasMap.set(alias, command);
            });
        }

        this.bot.loadingSequence.stage('require commands', async () => {
            if (this.bot.options.useBuiltInHelpCommand) {
                addCommand(helpCommand as unknown as AnyCommand);
            }

            (await importFolder<AnyCommand>(Command, this.bot.options.loadingPaths.commands)).forEach(({ path, item: command }) => {
                addCommand(command);
                this.bot.logger.log(path);
            });
        });
    }

    get(name: string, nameOnly = false): AnyCommand | undefined {
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
