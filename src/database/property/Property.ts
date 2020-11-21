import { PropertyAccess, PropertyAccessConstructor } from "./Access";
import { EntityType } from "../Entity";
import { validateIdentifier } from "../../utils";

/**
 * Объявление свойства в базе данных
 */
interface PropertyDefinition<E extends EntityType, T, A extends PropertyAccess<T>> {
    /**
     * Имя свойства. Для правильной работы базы данных
     * ключи свойств должны быть уникальными
     */
    readonly key: string;

    /**
     * Тип сущности (сервер / участник сервера)
     */
    readonly entityType: E;

    /**
     * Стандартное значение свойства
     */
    readonly defaultValue: T;

    /**
     * @returns true, если значение допустимо для этого свойства
     * @param value значение
     */
    validate(value: T): boolean;

    /**
     * Класс объекта, дающего доступ к чтению / изменению значения свойства.
     * Используйте этот параметр для расширения / абстракции функционала
     */
    readonly accessorClass?: PropertyAccessConstructor<T, A>;
}

export interface Property<E extends EntityType, T, A extends PropertyAccess<T> = PropertyAccess<T>> extends PropertyDefinition<E, T, A> { }

/**
 * Свойство сервера / участника сервера в базе данных бота
 */
export class Property<E extends EntityType, T, A extends PropertyAccess<T> = PropertyAccess<T>> {
    /**
     * @param definition информация свойства
     */
    constructor(definition: PropertyDefinition<E, T, A>) {
        Object.assign(this, definition);

        if (!validateIdentifier(this.key)) {
            throw new Error(`property key '${this.key}' is invalid (empty or includes spaces)`);
        }

        if (!this.validate(this.defaultValue)) {
            throw new Error(`default value of property '${this.key}' is invalid (validate returned false)`);
        }
    }
}

export type AnyProperty<E extends EntityType = EntityType> = Property<E, any>;
