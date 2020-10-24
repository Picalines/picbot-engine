import { Constructable, Guild } from "discord.js";
import { PromiseVoid } from "../utils";
import { BotDatabase } from "./BotDatabase";
import { DatabaseValueStorage } from "./Property/ValueStorage";

/**
 * Пользовательский интерфейс базы данных
 */
export interface BotDatabaseHandler {
    /**
     * Класс хранилища значений свойств серверов
     */
    guildPropertyStorageClass: Constructable<DatabaseValueStorage<'guild'>>;

    /**
     * Класс хранилища значений свойств участников серверов
     */
    memberPropertyStorageClass: Constructable<DatabaseValueStorage<'member'>>;

    /**
     * Обработчик события `guildCreate`
     * @param database база данных
     * @param guild сервер
     */
    onGuildCreate?(database: BotDatabase, guild: Guild): PromiseVoid;

    /**
     * Обработчик события `guildDelete`
     * @param database база данных
     * @param guild сервер
     */
    onGuildDelete?(database: BotDatabase, guild: Guild): PromiseVoid;

    /**
     * Запускается перед загрузкой базы данных
     * @param database база данных
     */
    prepareForLoading?(database: BotDatabase): PromiseVoid;

    /**
     * Загружает данные сервера
     * @param database база данных
     * @param guild сервер
     */
    loadGuild?(database: BotDatabase, guild: Guild): PromiseVoid;

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
     * @param database база данных
     * @param guild сервер
     */
    saveGuild?(database: BotDatabase, guild: Guild): PromiseVoid;

    /**
     * Обработчик события базы данных `loaded`
     * @param database база данных
     */
    onSaved?(database: BotDatabase): PromiseVoid;
}
