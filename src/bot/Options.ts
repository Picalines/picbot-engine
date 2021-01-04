import { Guild } from "discord.js";
import { assert, deepMerge, DeepPartialExcept, Overwrite, PromiseOrSync } from "../utils";
import { BotDatabaseHandler, Property, JsonDatabaseHandler } from "../database";
import { LoggerOptions, pipeLoggerTheme } from "../logger";
import { Bot } from "./Bot";
import { readFileSync } from "fs";

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
    fetchPrefixes: Fetcher<string[]>;

    /**
     * @returns локаль сервера
     * @default () => 'en-US'
     */
    fetchLocale: Fetcher<string>;

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
    fetchPrefixes: ArgumentFetcher<string[]>;
    /**
     * Локаль бота / свойство локали в базе данных / функция, возвращающая локаль сервера
     */
    fetchLocale: ArgumentFetcher<string>;
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

type Fetcher<T> = (bot: Bot, guild: Guild) => PromiseOrSync<T>;

type ArgumentFetcher<T> = T | Property<'guild', T> | Fetcher<T>;

/**
 * Обрабатывает аргумент настроек бота (вспомогательная функция)
 * @param options аргумент настроек бота
 */
export function parseBotOptionsArgument(options: BotOptionsArgument): BotOptions {
    let { fetchPrefixes, fetchLocale, token } = options;

    fetchPrefixes = parseFetcher(fetchPrefixes, <(f: any) => f is string[]>(f => f instanceof Array));
    fetchLocale = parseFetcher(fetchLocale, <(f: any) => f is string>(f => typeof f === 'string'));

    const { tokenType = 'string' } = options;

    switch (tokenType) {
        default:
            throw new Error(`unsupported token type '${tokenType}'`);

        case 'string':
            break;

        case 'env':
            assert(token in process.env, 'token environment variable not found');
            token = process.env[token]!;
            break;

        case 'file':
            token = readFileSync(token).toString();
            break;
    }

    return deepMerge(DefaultBotOptions, {
        ...options as any,
        fetchPrefixes,
        fetchLocale,
        token,
    });
}

function parseFetcher<T>(fetcher: ArgumentFetcher<T> | undefined, isValue: (fetcher: ArgumentFetcher<T> | undefined) => fetcher is T): Fetcher<T> | undefined {
    if (!fetcher) {
        return undefined;
    }

    if (isValue(fetcher)) {
        const value = fetcher;
        fetcher = () => value;
    }
    else if (fetcher instanceof Property) {
        const property = fetcher;
        fetcher = (bot, guild) => bot.database.accessProperty(guild, property).value();
    }

    return fetcher as Fetcher<T>;
}
