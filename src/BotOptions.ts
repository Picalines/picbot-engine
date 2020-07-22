import { ClientOptions } from "discord.js";
import { DeepPartial, ReadOnlyNonEmptyArray } from "./utils";

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
};

/**
 * Аргумент настроек бота в его конструкторе
 * @ignore
 */
export type BotOptionsArgument = DeepPartial<BotOptions> & {
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
        },
        guild: {
            defaultPrefixes: (optionsArg.guild?.defaultPrefixes as ReadOnlyNonEmptyArray<string> | undefined) ?? ['!'],
        },
    };
}
