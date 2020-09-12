import { GuildData } from "./Guild";
import { PromiseVoid } from "../utils";
import { BotDatabase } from "./Bot";
import { DatabasePropertyMap } from "./PropertyMap";

export interface BotDatabaseHandler {
    /**
     * Класс карты свойств сервера
     */
    readonly guildPropertyMapClass: new () => DatabasePropertyMap;
    
    /**
     * Класс карты свойств участника сервера
     */
    readonly memberDataClass: new () => DatabasePropertyMap;

    /**
     * Обработчик события `guildCreate`
     * @param guildData данные сервера
     */
    onGuildCreate?(guildData: GuildData): PromiseVoid;

    /**
     * Обработчик события `guildDelete`
     * @param guildData данные сервера
     */
    onGuildDelete?(guildData: GuildData): PromiseVoid;

    /**
     * Запускается перед загрузкой базы данных
     * @param database база данных
     */
    prepareForLoading?(database: BotDatabase): PromiseVoid;

    /**
     * Загружает данные сервера
     * @param emptyData пустые данные сервера
     */
    loadGuild?(emptyData: GuildData): PromiseVoid;

    /**
     * Обработчик события базы данных `loaded`
     * @param database база данных
     */
    onLoaded?(database: BotDatabase): PromiseVoid;

    /**
     * Запускается перед сохранением базы данных
     * @param database база данных
     */
    prepareForSaving?(database: BotDatabase): PromiseVoid;

    /**
     * Сохраняет данные сервера
     * @param guildData данные сервера
     */
    saveGuild?(guildData: GuildData): PromiseVoid;

    /**
     * Обработчик события базы данных `loaded`
     * @param database база данных
     */
    onSaved?(database: BotDatabase): PromiseVoid;
}
