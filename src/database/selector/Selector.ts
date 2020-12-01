import { GuildManager, GuildMemberManager } from "discord.js";
import { EntityType, Entity } from "../Entity";
import { AnyExpression } from "./Expression";
import { QueryOperators } from "./Operator";

export interface EntitySelectorDefinition<E extends EntityType> {
    /**
     * Тип сущностей, которые ищет селектор
     */
    readonly entityType: E;

    /**
     * Выражение, по которому селектор ищет сущностей
     */
    readonly expression: (q: QueryOperators<E>) => AnyExpression<E>;
}

export interface EntitySelector<E extends EntityType> extends EntitySelectorDefinition<E> { }

/**
 * Селектор сущности в базе данных. Используется в
 * методе [[BotDatabase.selectEntities]]
 */
export class EntitySelector<E extends EntityType> {
    constructor(definition: EntitySelectorDefinition<E>) {
        Object.assign(this, definition);
    }
}

/**
 * Настройки селектора
 */
export interface EntitySelectorOptions<E extends EntityType> {
    /**
     * Менеджер сущностей, по которому библиотека должна сделать выборку
     */
    readonly manager: E extends 'member' ? GuildMemberManager : GuildManager;

    /**
     * Функция фильтрации сущностей, которых библиотека получила из менеджера
     */
    readonly filter?: (entity: Entity<E>) => boolean;

    /**
     * Максимальное количество сущностей, которое может найти селектор
     * @default Infinity
     */
    readonly maxCount?: number;

    /**
     * Ошибка, которую выбросит селектор, если он ничего не найдёт
     * @default undefined
     */
    readonly throwOnNotFound?: Error;
}
