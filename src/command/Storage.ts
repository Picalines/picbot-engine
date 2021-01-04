import { Bot } from "../bot";
import { requireFolder } from "../utils";
import { AnyCommand, Command } from "./Command";
import { helpCommand } from "./help";

/**
 * Хранилище команд
 */
export class CommandStorage implements Iterable<AnyCommand> {
    /**
     * Map команд по их именам
     */
    private readonly nameMap = new Map<string, AnyCommand>();

    /**
     * Map команд по алиасам
     */
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

        this.bot.loadingSequence.stage('require commands', () => {
            if (this.bot.options.useBuiltInHelpCommand) {
                addCommand(helpCommand as unknown as AnyCommand);
            }

            requireFolder<AnyCommand>(Command, this.bot.options.loadingPaths.commands).forEach(([path, command]) => {
                addCommand(command);
                this.bot.logger.log(path);
            });
        });
    }

    /**
     * Возвращает данные команды по её имени или алиасу
     * @param name имя или алиас команды
     * @param nameOnly нужно ли ингорировать алиасы
     */
    get(name: string, nameOnly = false): AnyCommand | undefined {
        return this.nameMap.get(name) ?? (!nameOnly ? this.aliasMap.get(name) : undefined);
    }

    /**
     * @returns true, если в хранилище есть команда с таким именем или алиасом
     * @param name имя или алиас команды
     * @param nameOnly нужно ли игнорировать алиасы
     */
    has(name: string, nameOnly = false): boolean {
        name = name.toLowerCase();
        return this.nameMap.has(name) || (!nameOnly && this.aliasMap.has(name));
    }

    /**
     * Количество команд в хранилище
     */
    get size(): number {
        return this.nameMap.size;
    }

    [Symbol.iterator]() {
        return this.nameMap.values();
    }
}
