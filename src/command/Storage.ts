import { PathLike, readdirSync } from "fs";
import { join } from "path";
import { AnyCommand, Command } from "./Command";

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

    /**
     * Добавляет команду в память бота
     * @param command команда
     */
    public add(command: AnyCommand): void {
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

    /**
     * Возвращает данные команды по её имени или алиасу
     * @param name имя или алиас команды
     * @param nameOnly нужно ли ингорировать алиасы
     */
    public get<Args extends unknown[]>(name: string, nameOnly = false): Command<Args> | undefined {
        return (this.nameMap.get(name) ?? (!nameOnly ? this.aliasMap.get(name) : undefined)) as Command<Args> | undefined;
    }

    /**
     * @returns true, если в хранилище есть команда с таким именем или алиасом
     * @param name имя или алиас команды
     * @param nameOnly нужно ли игнорировать алиасы
     */
    public has(name: string, nameOnly = false): boolean {
        name = name.toLowerCase();
        return this.nameMap.has(name) || (!nameOnly && this.aliasMap.has(name));
    }

    /**
     * Количество команд в хранилище
     */
    get size(): number {
        return this.nameMap.size;
    }

    /**
     * @returns список всех команд в хранилище
     */
    array(): AnyCommand[] {
        return [...this.nameMap.values()];
    }

    public [Symbol.iterator]() {
        return new Set(this.nameMap.values()).values();
    }

    /**
     * Возвращает словарь с командами, сгруппированными по свойству [[CommandInfo.group]]
     * @param defaultGroup группа команд, у которой не прописано свойство [[CommandInfo.group]]
     */
    public grouped(defaultGroup: string): Map<string, AnyCommand[]> {
        const map = new Map<string, AnyCommand[]>();

        for (const command of this) {
            const group = command.group || defaultGroup;
            const array = map.get(group);
            array ? array.push(command) : map.set(group, [command]);
        }

        return map;
    }

    /**
     * Вызывает require на все .js файлы из папки, и добавляет все экпортированные команды в хранилище.
     * Команда должна быть экспортирована как `module.exports = new Command({ ... });`
     * @param path путь до папки с командами
     */
    public requireFolder(path: PathLike) {
        const jsFiles = readdirSync(path).filter(file => file.endsWith('.js'));

        const _require = require.main?.require ?? require;
        path = String(path);

        const modules = jsFiles.map(file => _require('./' + join(path as string, file)));
        const commands = modules.filter(exports => exports instanceof Command) as AnyCommand[];

        commands.forEach(command => this.add(command));
    }
}
