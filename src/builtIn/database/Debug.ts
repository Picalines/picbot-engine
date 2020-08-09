import { BotDatabaseHandler } from "../../database/Bot";

/**
 * Пустой обработчик базы данных бота. Не сохраняет и не загружает никаких данных.
 */
export const DebugBotDatabaseHandler: BotDatabaseHandler = {
    loadGuild: () => {},
    saveGuild: () => {},
};
