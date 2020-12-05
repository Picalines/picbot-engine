import { Guild } from "discord.js";
import { DeepPartial, GroupsOfCache, NonEmptyReadonly, Overwrite, PromiseOrSync } from "./utils";
import { BotDatabaseHandler, AnyProperty, Property, AnyEntitySelector, BotDatabase } from "./database";
import { JsonDatabaseHandler } from "./builtIn/database";
import { LoggerOptions } from "./Logger";
import { pipeLoggerTheme } from "./builtIn/loggerTheme/Pipe";
import { Bot } from "./Bot";

/**
 * Объект с настройками бота
 */
export type BotOptions = {
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
        /**
         * Кэш базы данных
         */
        cache: { [K in keyof GroupsOfCache<BotDatabase['cache']>]: readonly InstanceType<GroupsOfCache<BotDatabase['cache']>[K]>[] };
    };
};

/**
 * Стандартные настройки бота
 */
export const DefaultBotOptions: BotOptions = {
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
        cache: {
            properties: [],
            selectors: [],
        },
    },
};

/**
 * Аргумент настроек бота в его конструкторе
 * @ignore
 */
export type BotOptionsArgument = Overwrite<DeepPartial<Omit<BotOptions, 'database'>>, Partial<{
    /**
     * Список стандартных префиксов / свойство префиксов в базе данных / функция, возвращающая список префиксов на сервере
     */
    fetchPrefixes: NonEmptyReadonly<string[]> | Property<'guild', string[]> | BotOptions['fetchPrefixes'];
    /**
     * Настройки базы данных бота
     */
    database: Overwrite<Partial<BotOptions['database']>, {
        cache?: Partial<BotOptions['database']['cache']>,
    }>;
}>>;
