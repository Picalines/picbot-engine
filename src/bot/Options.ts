import { Guild } from "discord.js";
import { DeepPartialExcept, NonEmptyReadonly, Overwrite, PromiseOrSync } from "../utils";
import { BotDatabaseHandler, Property, JsonDatabaseHandler } from "../database";
import { LoggerOptions, pipeLoggerTheme } from "../logger";
import { Bot } from "./Bot";

export type BotOptionsFetcher<T> = (bot: Bot, guild: Guild) => PromiseOrSync<T>;

export type BotOptionsArgumentFetcher<T> = T | Property<'guild', T> | BotOptionsFetcher<T>;

/**
 * Объект с настройками бота
 */
export type BotOptions = Readonly<{
    /**
     * Токен бота
     */
    token: string;

    /**
     * Тип токена
     * @default 'string'
     */
    tokenType: 'string' | 'file' | 'env';

    /**
     * Пути для загрузчика
     */
    loadingPaths: Readonly<{
        /**
         * @default 'src/properties'
         */
        properties: string;

        /**
         * @default 'src/selectors'
         */
        selectors: string;

        /**
         * @default 'src/events'
         */
        events: string;

        /**
         * @default 'src/commands'
         */
        commands: string;

        /**
         * @default 'src/terms'
         */
        terms: string;

        /**
         * @default 'src/translations'
         */
        translations: string;
    }>;

    /**
     * Могут ли другие боты использовать команды
     * @default false
     */
    canBotsRunCommands: boolean;

    /**
     * @returns список префиксов бота на сервере
     * @default () => ['!']
     */
    fetchPrefixes: BotOptionsFetcher<string[]>;

    /**
     * @returns локаль сервера
     * @default () => 'en-US'
     */
    fetchLocale: BotOptionsFetcher<string>;

    /**
     * Использовать ли встроенную команду help
     * @default true
     */
    useBuiltInHelpCommand: boolean;

    /**
     * Настройки логгера
     */
    loggerOptions: Partial<LoggerOptions>;

    /**
     * Обработчик базы данных (объект, хранящий функции для загрузки / сохранения данных серверов)
     * @default new JsonDatabaseHandler({ rootFolderPath: '/database/', guildsPath: '/guilds/' })
     */
    databaseHandler: BotDatabaseHandler;
}>;

/**
 * Аргумент настроек бота в его конструкторе
 */
export type BotOptionsArgument = Overwrite<DeepPartialExcept<BotOptions, 'token'>, Partial<{
    /**
     * Список стандартных префиксов / свойство префиксов в базе данных / функция, возвращающая список префиксов на сервере
     */
    fetchPrefixes: BotOptionsArgumentFetcher<string[]>;
    /**
     * Локаль бота / свойство локали в базе данных / функция, возвращающая локаль сервера
     */
    fetchLocale: BotOptionsArgumentFetcher<string>;
}>>;

/**
 * Стандартные настройки бота
 */
export const DefaultBotOptions: BotOptions = {
    token: '',
    tokenType: 'string',
    loadingPaths: {
        commands: 'src/commands',
        events: 'src/events',
        properties: 'src/properties',
        selectors: 'src/selectors',
        terms: 'src/terms',
        translations: 'src/translations',
    },
    canBotsRunCommands: false,
    fetchPrefixes: () => ['!'],
    fetchLocale: () => 'en-US',
    useBuiltInHelpCommand: true,
    loggerOptions: {
        hideInConsole: false,
        ignoreWarnings: false,
        consoleTheme: pipeLoggerTheme,
    },
    databaseHandler: new JsonDatabaseHandler({
        databasePath: '/database/',
        jsonIndent: 0,
    }),
};
