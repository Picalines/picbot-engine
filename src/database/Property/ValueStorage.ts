import { PromiseOrSync } from "../../utils";
import { BotDatabase } from "../BotDatabase";
import { Entity, WidenEntity } from "../Entity";
import { AnyExpression } from "../Selector/Expression";

/**
 * Абстрактный класс, хранящий значения свойств сущностей (серверов / участников)
 */
export abstract class DatabaseValueStorage<E extends Entity> {
    /**
     * @param database ссылка на базу данных
     */
    constructor(
        public readonly database: BotDatabase,
        public readonly entityType: E,
    ) { }

    /**
     * Сохраняет значение свойства для конкретной сущности
     * @param entity сущность (сервер / участник сервера)
     * @param key имя свойства
     * @param value значение свойства
     */
    abstract storeValue<T>(entity: WidenEntity<E>, key: string, value: T): PromiseOrSync<void>;

    /**
     * @returns значение свойства конкретной сущности (либо undefined)
     * @param entity сущность (сервер / участник сервера)
     * @param key имя свойства
     */
    abstract restoreValue<T>(entity: WidenEntity<E>, key: string): PromiseOrSync<T | undefined>;

    /**
     * @returns true, если значение свойства сущности успешно удалено из хранилища
     * @param entity сущность (сервер / участник сервера)
     * @param key имя свойства
     */
    abstract deleteValue(entity: WidenEntity<E>, key: string): PromiseOrSync<boolean>;

    /**
     * @returns список выбранных сущностей, которые 'подходят' по условию expression
     * @param entities список всех сущностей
     * @param expression выражение
     * @param maxCount максимальное колчиество найденых сущностей. Гарантируется, что это оно не равно нулю
     */
    abstract selectEntities(entities: IterableIterator<WidenEntity<E>>, expression: AnyExpression<E>, maxCount: number): PromiseOrSync<WidenEntity<E>[]>;

    /**
     * Очищает все данные в хранилище. Библиотека вызывает эту функцию,
     * когда бот уходит с сервера.
     */
    abstract cleanup(): PromiseOrSync<void>;

    /**
     * Очищает данные сущности
     * @param entity сущность (сервер / участник сервера)
     */
    abstract cleanupEntity(entity: WidenEntity<E>): PromiseOrSync<void>;
}
