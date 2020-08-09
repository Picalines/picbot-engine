import { ClientOptions } from "discord.js";
import { DeepPartial, ReadOnlyNonEmptyArray } from "./utils";
import { BotDatabaseHandler } from "./database/Bot";
import { DebugBotDatabaseHandler } from "./builtIn/database";

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
            prefix: boolean;
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
         * @default DebugBotDatabaseHandler
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
};

/**
 * Аргумент настроек бота в его конструкторе
 * @ignore
 */
export type BotOptionsArgument = DeepPartial<Omit<BotOptions, 'database'>> & {
    database?: Partial<BotOptions['database']>
} & {
    clientOptions?: ClientOptions;
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
                prefix: optionsArg.commands?.builtIn?.prefix ?? true,
            },
            sendNotFoundError: optionsArg.commands?.sendNotFoundError ?? false,
        },
        guild: {
            defaultPrefixes: (optionsArg.guild?.defaultPrefixes as ReadOnlyNonEmptyArray<string> | undefined) ?? ['!'],
        },
        database: {
            handler: optionsArg.database?.handler ?? DebugBotDatabaseHandler,
            ignoreBots: optionsArg.database?.ignoreBots ?? true,
            saveOnSigint: optionsArg.database?.saveOnSigint ?? true,
        },
    };
}
