import { Constructable, Guild, GuildMember } from "discord.js";
import { PropertyAccess as PropertyAccess } from "./Access";

/**
 * Сущность в базе данных (сервер / участник сервера)
 */
export type Entity = 'guild' | 'member';

/**
 * Разворачивает строчный тип сущности в объект
 */
export type WidenEntity<T extends Entity> =
    T extends 'guild' ? Guild
    : T extends 'member' ? GuildMember
    : never;

/**
 * Объявление свойства в базе данных
 */
export interface PropertyDefinition<E extends Entity, T, A extends PropertyAccess<T>> {
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
    readonly accessorClass?: Constructable<A>;
}

export interface Property<E extends Entity, T, A extends PropertyAccess<T> = PropertyAccess<T>>
    extends PropertyDefinition<E, T, A> { }

/**
 * Свойство сервера / участника сервера в базе данных бота
 */
export class Property<E extends Entity, T, A extends PropertyAccess<T> = PropertyAccess<T>> {
    /**
     * @param definition информация свойства
     */
    constructor(definition: PropertyDefinition<E, T, A>) {
        Object.assign(this, definition);
    }
}

export type AnyProperty<E extends Entity = Entity> = Property<E, any>;
