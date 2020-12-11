import { Guild } from "discord.js";
import { DeepPartial, DeepPartialExcept, NonEmptyReadonly, Overwrite, PromiseOrSync } from "./utils";
import { BotDatabaseHandler, Property } from "./database";
import { JsonDatabaseHandler } from "./builtIn/database";
import { LoggerOptions } from "./Logger";
import { pipeLoggerTheme } from "./builtIn/loggerTheme/Pipe";
import { Bot } from "./Bot";

/**
 * Объект с настройками бота
 */
export type BotOptions = {
    /**
     * Токен бота
     */
    token: string;
    /**
     * Пути для загрузчика
     */
    loadingPaths: {
        /**
         * @default 'properties'
         */
        properties: string;
        /**
         * @default 'selectors'
         */
        selectors: string;
        /**
         * @default 'events'
         */
        events: string;
        /**
         * @default 'commands'
         */
        commands: string;
    };
    /**
     * Могут ли другие боты использовать команды
     * @default false
     */
    canBotsRunCommands: boolean;
    /**
     * Функция, возвращающая список префиксов бота на сервере
     * @default () => ['!']
     */
    fetchPrefixes: (bot: Bot, guild: Guild) => PromiseOrSync<string[]>;
    /**
     * Использовать ли встроенную команду help
     * @default true
     */
    useBuiltInHelpCommand: boolean;
    /**
     * Вызывать ли `client.destroy` при событии `process.SIGINT`
     * @default true
     */
    destroyClientOnSigint: boolean;
    /**
     * Настройки логгера
     */
    loggerOptions: Partial<LoggerOptions>;
    /**
     * Настройки базы данных
     */
    database: {
        /**
         * Обработчик базы данных (объект, хранящий функции для загрузки / сохранения данных серверов)
         * @default new JsonDatabaseHandler({ rootFolderPath: '/database/', guildsPath: '/guilds/' })
         */
        handler: BotDatabaseHandler;
        /**
         * Сохранять ли базу данных на событии `process.SIGINT`.
         * @default true
         */
        saveOnSigint: boolean;
    };
};

/**
 * Аргумент настроек бота в его конструкторе
 */
export type BotOptionsArgument = Overwrite<DeepPartialExcept<BotOptions, 'token'>, Partial<{
    /**
     * Список стандартных префиксов / свойство префиксов в базе данных / функция, возвращающая список префиксов на сервере
     */
    fetchPrefixes: NonEmptyReadonly<string[]> | Property<'guild', string[]> | BotOptions['fetchPrefixes'];
    /**
     * Настройки базы данных бота
     */
    database: Partial<BotOptions['database']>;
}>>;

/**
 * Стандартные настройки бота
 */
export const DefaultBotOptions: BotOptions = {
    token: '',
    loadingPaths: {
        commands: 'src/commands',
        events: 'src/events',
        properties: 'src/properties',
        selectors: 'src/selectors',
    },
    canBotsRunCommands: false,
    destroyClientOnSigint: true,
    fetchPrefixes: () => ['!'],
    useBuiltInHelpCommand: true,
    loggerOptions: {
        hideInConsole: false,
        ignoreWarnings: false,
        consoleTheme: pipeLoggerTheme,
    },
    database: {
        handler: new JsonDatabaseHandler({
            databasePath: '/database/',
            jsonIndent: 0,
        }),
        saveOnSigint: true,
    },
};
