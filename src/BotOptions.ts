import { DeepPartial, ReadOnlyNonEmptyArray } from "./utils";
import { BotDatabaseHandler } from "./database/Bot";
import { DebugBotDatabaseHandler } from "./builtIn/database";

const builtInCommandNames = [
    'help',
    'ban',
    'kick',
    'clear',
    'prefix',
    'avatar',
    'setgreeting',
] as const;

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
        builtIn: { [name in typeof builtInCommandNames[number]]: boolean };
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
    const builtInCommandsArg = optionsArg.commands?.builtIn ?? {};
    const builtInCommandsOption: BotOptions['commands']['builtIn'] = {} as any;
    builtInCommandNames.forEach(name => {
        builtInCommandsOption[name] = builtInCommandsArg[name] ?? true;
    });

    return {
        permissions: {
            checkAdmin: optionsArg.permissions?.checkAdmin ?? true
        },
        ignoreBots: optionsArg.ignoreBots ?? true,
        commands: {
            builtIn: builtInCommandsOption,
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
        utils: {
            autoStopTyping: optionsArg.utils?.autoStopTyping ?? true,
        },
    };
}
