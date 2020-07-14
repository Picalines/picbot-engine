import { Command, CommandExecuteable } from "./Info";

/**
 * Хранилище команд
 */
export class CommandStorage implements Iterable<Command> {
    readonly #commands = new Map<string, Command>();
    #size = 0;

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
            command = { name, ...data };
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
}
