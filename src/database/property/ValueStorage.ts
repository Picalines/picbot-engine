import { EmptyObject, PromiseOrSync } from "../../utils";
import { BotDatabase } from "../BotDatabase";
import { EntityType, Entity } from "../Entity";
import { AnyExpression, EntitySelector, SelectorVars, SelectorVarValues } from "../selector";

/**
 * Абстрактный класс, хранящий значения свойств сущностей (серверов / участников)
 */
export abstract class DatabaseValueStorage<E extends EntityType> {
    /**
     * @param database ссылка на базу данных
     * @param entityType тип сущностей в хранилище
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
    abstract storeValue<T>(entity: Entity<E>, key: string, value: T): PromiseOrSync<void>;

    /**
     * @returns значение свойства конкретной сущности (либо undefined)
     * @param entity сущность (сервер / участник сервера)
     * @param key имя свойства
     */
    abstract restoreValue<T>(entity: Entity<E>, key: string): PromiseOrSync<T | undefined>;

    /**
     * @returns true, если значение свойства сущности успешно удалено из хранилища
     * @param entity сущность (сервер / участник сервера)
     * @param key имя свойства
     */
    abstract deleteValue(entity: Entity<E>, key: string): PromiseOrSync<boolean>;

    /**
     * @returns список выбранных сущностей, которые 'подходят' по условию expression
     * @param entities список всех сущностей
     * @param selector селектор
     * @param expression обработанное выражение
     */
    abstract selectEntities<Vars extends SelectorVars = EmptyObject>(entities: IterableIterator<Entity<E>>, selector: EntitySelector<E, Vars>, expression: AnyExpression<E>, variables: SelectorVarValues<Vars>): AsyncGenerator<Entity<E>> | Generator<Entity<E>>;

    /**
     * Очищает все данные в хранилище. Библиотека вызывает эту функцию,
     * когда бот уходит с сервера.
     */
    abstract cleanup(): PromiseOrSync<void>;

    /**
     * Очищает данные сущности
     * @param entity сущность (сервер / участник сервера)
     */
    abstract cleanupEntity(entity: Entity<E>): PromiseOrSync<void>;
}

export type DatabaseValueStorageConstructor<E extends EntityType> = new (database: BotDatabase, entityType: E) => DatabaseValueStorage<E>;
