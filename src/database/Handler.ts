import { GuildData } from "./Guild";
import { PromiseVoid } from "../utils";
import { BotDatabase } from "./Bot";

export interface BotDatabaseHandler {
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
    beforeLoad?(database: BotDatabase): PromiseVoid;

    /**
     * Загружает данные сервера
     * @param emptyData пустые данные сервера
     */
    loadGuild(emptyData: GuildData): PromiseVoid;

    /**
     * Запускается после успешной загрузки базы данных
     * @param database база данных
     */
    loaded?(database: BotDatabase): PromiseVoid;

    /**
     * Запускается перед сохранением базы данных
     * @param database база данных
     */
    beforeSave?(database: BotDatabase): PromiseVoid;
    /**
     * Сохраняет данные сервера
     * @param guildData данные сервера
     */
    saveGuild(guildData: GuildData): PromiseVoid;

    /**
     * Запускается после успешного сохранения базы данных
     * @param database база данных
     */
    saved?(database: BotDatabase): PromiseVoid;
}
