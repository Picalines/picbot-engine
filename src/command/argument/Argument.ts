import { ArgumentReader } from "./Reader";

/**
 * Интерфейс аргумента комманды
 */
export interface CommandArgument<T> {
    /**
     * Имя аргумента команды
     */
    readonly name: string;

    /**
     * Описание аргумента
     */
    readonly description?: string;

    /**
     * @returns функцию, читающаю аргумент
     */
    readonly reader: ArgumentReader<T>;
}
