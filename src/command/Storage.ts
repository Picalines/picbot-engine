import { Command, CommandExecuteable, CommandInfo } from "./Info";

type CommandOptionalInfo = Omit<CommandInfo, 'name'>;

type CommandRegisterData = {
    executeable: CommandExecuteable,
    info?: CommandOptionalInfo,
}

/**
 * Хранилище команд
 */
export class CommandStorage {
    readonly #commands = new Map<string, Command>();

    /**
     * Добавляет новую команду в память бота
     * @param name имя команды
     * @param data информация команды (функция или объект с дополнительной информацией)
     */
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
     * Свойство, возвращающее список всех команд в хранилище
     */
    get all(): readonly Command[] {
        return [...new Set(this.#commands.values())];
    }
}
