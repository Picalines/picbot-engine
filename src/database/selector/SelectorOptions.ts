import { GuildMemberManager, GuildManager } from "discord.js";
import { EntityType, Entity } from "../Entity";

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
