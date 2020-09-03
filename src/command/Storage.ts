import { Command } from "./Command";

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
    public register(command: Command) {
        this.#commands.set(command.info.name, command);

        command.info.aliases?.forEach(alias => {
            if (this.#commands.has(alias)) {
                throw new Error(`command alias '${alias}' overlaps with another command`);
            }
            this.#commands.set(alias, command);
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
     * Возвращает словарь с командами, сгруппированными по свойству [[CommandInfo.group]]
     * @param defaultGroup группа команд, у которой не прописано свойство [[CommandInfo.group]]
     */
    public getGrouped(defaultGroup: string): Map<string, Command[]> {
        const map = new Map<string, Command[]>();

        for (const command of this) {
            const group = command.info.group || defaultGroup;
            const list = map.get(group);

            if (list) {
                list.push(command);
            }
            else {
                map.set(group, [command]);
            }
        }

        return map;
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
