import { ArgumentReaderStorage } from "./argument/Storage";
import { CommandContext } from "./Context";
import { Command, CommandArgumentData, CommandExecuteable } from "./Info";

/**
 * Хранилище команд
 */
export class CommandStorage implements Iterable<Command> {
    readonly #commands = new Map<string, Command>();
    #size = 0;

    #argumentReaders: ArgumentReaderStorage;

    constructor(argumentReaders: ArgumentReaderStorage) {
        this.#argumentReaders = argumentReaders;
    }

    /**
     * Добавляет новую команду в память бота
     * @param name имя команды
     * @param data информация команды (функция или объект с дополнительной информацией)
     */
    public register(name: string, data: Omit<Command, 'name'> | CommandExecuteable) {
        const validateName = (name: string) => name.length > 0 && !name.includes(' ');

        if (!validateName(name)) {
            throw new Error(`invalid command name '${name}'`);
        }

        let command: Command;
        if (typeof data == 'function') {
            command = { name, execute: data };
        }
        else {
            if (data.syntax && !data.arguments) {
                command = {
                    name,
                    ...data,
                    arguments: this.buildCommandSyntax(name, this.#argumentReaders, data.syntax),
                };
            }
            else {
                command = { name, ...data };
            }
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

        this.#size += 1;
    }

    /**
     * Возвращает данные команды по её имени или алиасу
     * @param name имя или алиас команды
     */
    public getByName(name: string): Command | never {
        const command = this.#commands.get(name);
        if (!command) {
            throw new Error(`command '${name}' not found`);
        }
        return command;
    }

    /**
     * Количество команд в хранилище
     */
    get size(): number {
        return this.#size;
    }

    /**
     * Свойство, возвращающее список всех команд в хранилище
     */
    get list(): readonly Command[] {
        return [...new Set(this.#commands.values())];
    }

    public [Symbol.iterator]() {
        return new Set(this.#commands.values()).values();
    }

    private buildCommandSyntax(commandName: string, argReaders: ArgumentReaderStorage, syntax: string): CommandArgumentData[] {
        if (!CommandContext.commandSyntaxRegex.test(syntax)) {
            throw new Error(`invalid '${commandName}' command syntax: ${syntax}`);
        }

        const argMatches = syntax.matchAll(CommandContext.syntaxArgumentRegex);
        const argDatas: CommandArgumentData[] = [];

        for (const argMatch of argMatches) {
            if (!argMatch.groups) continue;

            const { type, name } = argMatch.groups;
            if (argDatas.find(d => d.name == name)) {
                throw new Error(`'${commandName}' command argument name '${name}' already used`);
            }

            const reader = argReaders.readers[type];
            if (!reader) {
                throw new Error(`unknown argument type '${type}' ('${commandName}' command syntax)`);
            }

            let readDefault: CommandArgumentData['readDefault'] = undefined;
            if (argMatch.groups.default !== undefined) {
                if (argMatch.groups.default == '_') {
                    readDefault = () => undefined;
                }
                else {
                    const defaultInput = argMatch.groups.default;
                    readDefault = ({ message }) => {
                        const result = reader(defaultInput, message);
                        if (result.isError) {
                            const error = typeof result.error == 'string' ? result.error : result.error.message;
                            throw new Error(`invalid default argument value '${defaultInput}' (${error})`);
                        }
                        return result.value.parsedValue;
                    }
                }
            }

            argDatas.push({
                name,
                type,
                readDefault,
            });
        }

        return argDatas;
    }
}
