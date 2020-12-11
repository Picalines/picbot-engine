import { Property } from "./Property";
import { EntityType } from "../Entity";

interface AccessMethods<T> {
    /**
     * Ставит новое значение свойства
     * @param value новое значение свойства
     */
    set(value: T): Promise<void>;

    /**
     * Ставит свойству его стандартное значение
     * @returns true, если значение изменилось
     */
    reset(): Promise<boolean>;

    /**
     * Если база данных ещё не хранит значение этого свойства,
     * то возвращает undefined
     */
    rawValue(): Promise<T | undefined>;

    /**
     * Если база данных ещё не хранит значение свойства,
     * то возвращает стандартное значение
     * @returns значение свойства
     */
    value(): Promise<T>;
}

export interface PropertyAccess<T> extends AccessMethods<T> { }

/**
 * Объект, дающий доступ к чтению / изменению значения свойства сущности в базе данных
 */
export class PropertyAccess<T> {
    /**
     * @param property ссылка свойство, к которому мы получаем доступ
     * @param methods методы доступа. Библиотека сама передаёт этот параметр в [[BotDatabase.accessProperty]]
     */
    constructor(
        readonly property: Property<EntityType, T>,
        methods: AccessMethods<T>
    ) {
        Object.assign(this, methods);
    }
}

export interface PropertyAccessConstructor<T, A extends PropertyAccess<T> = PropertyAccess<T>> {
    new(property: Property<EntityType, T>, methods: AccessMethods<T>): A;
}
