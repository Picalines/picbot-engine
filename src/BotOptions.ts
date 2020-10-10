import { DeepPartial, ReadOnlyNonEmptyArray } from "./utils";
import { BotDatabaseHandler } from "./database/Handler";
import { JsonDatabaseHandler } from "./builtIn/database";

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
         * @default JsonDatabaseHandler({ dirPath: '/database/', guildsPath: '/guilds/' })
         */
        handler: BotDatabaseHandler;
        /**
         * Запретить ли хранить данные по ботам на сервере
         * @default true
         */
        ignoreBots: boolean;
        /**
         * Сохранять ли базу данных на событии `process.SIGINT`.
         * @default true
         */
        saveOnSigint: boolean;
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
    return {
        permissions: {
            checkAdmin: optionsArg.permissions?.checkAdmin ?? true
        },
        ignoreBots: optionsArg.ignoreBots ?? true,
        commands: {
            builtIn: {
                help: optionsArg.commands?.builtIn?.help ?? true,
                ban: optionsArg.commands?.builtIn?.ban ?? true,
                kick: optionsArg.commands?.builtIn?.kick ?? true,
                clear: optionsArg.commands?.builtIn?.clear ?? true,
                prefix: optionsArg.commands?.builtIn?.prefix ?? true,
                avatar: optionsArg.commands?.builtIn?.avatar ?? true,
            },
            sendNotFoundError: optionsArg.commands?.sendNotFoundError ?? false,
        },
        guild: {
            defaultPrefixes: (optionsArg.guild?.defaultPrefixes as ReadOnlyNonEmptyArray<string> | undefined) ?? ['!'],
        },
        database: {
            handler: optionsArg.database?.handler ?? new JsonDatabaseHandler({
                rootFolderPath: '/database/', guildsPath: '/guilds/',
            }),
            ignoreBots: optionsArg.database?.ignoreBots ?? true,
            saveOnSigint: optionsArg.database?.saveOnSigint ?? true,
        },
        utils: {
            autoStopTyping: optionsArg.utils?.autoStopTyping ?? true,
        },
    };
}
