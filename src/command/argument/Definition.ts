import { InferPrimitive } from "../../utils";
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
    readonly description: string;

    /**
     * Функция, читающая аргумент
     */
    readonly reader: ArgumentReader<InferPrimitive<T>>;
}
