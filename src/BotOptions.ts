import { deepMerge, DeepPartial, ReadOnlyNonEmptyArray } from "./utils";
import { BotDatabaseHandler } from "./database/Handler";
import { JsonDatabaseHandler } from "./builtIn/database";
import { AnyProperty } from "./database/Property/Definition";

/**
 * Объект с настройками бота
 */
export type BotOptions = {
    /**
     * Настройки проверки прав
     */
    permissions: {
        /**
         * Аргумент [checkAdmin](https://discord.js.org/#/docs/main/stable/class/Permissions?scrollTo=has) из discord.js
         * @default true
         */
        checkAdmin: boolean;
    };
    /**
     * Игнорировать ли сообщения других ботов
     * @default true
     */
    ignoreBots: boolean;
    /**
     * Настройки команд бота
     */
    commands: {
        /**
         * Включение встроенных команд
         * @default true (для всех)
         */
        builtIn: {
            help: boolean;
            ban: boolean;
            kick: boolean;
            clear: boolean;
            prefix: boolean;
            avatar: boolean;
        };
        /**
         * Отсылать ли сообщение о ненайденной команде
         * @default false
         */
        sendNotFoundError: boolean;
    };
    /**
     * Настройки серверов
     */
    guild: {
        /**
         * Стандартные префиксы бота
         * @default ['!']
         */
        defaultPrefixes: ReadOnlyNonEmptyArray<string>;
    };
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
         * Список свойств, о существовании которых библиотека должна знать до загрузки базы данных
         * @default []
         */
        definedProperties: ReadonlyArray<AnyProperty>;
    };
    utils: {
        /**
         * Если true, бот автоматически перестаёт печатать после завершения работы команды
         * @default true
         */
        autoStopTyping: boolean;
    };
};

/**
 * Стандартные настройки бота
 */
export const DefaultBotOptions: BotOptions = {
    permissions: {
        checkAdmin: true,
    },
    ignoreBots: true,
    commands: {
        builtIn: {
            help: true,
            ban: true,
            kick: true,
            clear: true,
            prefix: true,
            avatar: true,
        },
        sendNotFoundError: false,
    },
    guild: {
        defaultPrefixes: ['!'],
    },
    database: {
        handler: new JsonDatabaseHandler({
            rootFolderPath: '/database/',
            guildsPath: '/guilds/',
            jsonIndent: 0,
        }),
        saveOnSigint: true,
        definedProperties: [],
    },
    utils: {
        autoStopTyping: true,
    },
};

/**
 * Аргумент настроек бота в его конструкторе
 * @ignore
 */
export type BotOptionsArgument = DeepPartial<Omit<BotOptions, 'database'>> & {
    database?: Partial<BotOptions['database']>
};

/**
 * Вспомогательная функция для перевода [[BotOptionsArgument]] в [[BotOptions]]
 * @ignore
 */
export function ParseBotOptionsArgument(optionsArg: BotOptionsArgument): BotOptions {
    return deepMerge(DefaultBotOptions, optionsArg as any);
}
