import { ClientOptions } from "discord.js";

/**
 * Объект с настройками бота
 */
export type BotOptions = {
    /**
     * Список префиксов бота
     */
    prefixes: string[];
    /**
     * Настройки проверки прав
     */
    permissions: {
        /**
         * Аргумент [checkAdmin](https://discord.js.org/#/docs/main/stable/class/Permissions?scrollTo=has) из discord.js
         */
        checkAdmin: boolean;
    };
};

/**
 * Аргумент настроек бота в его конструкторе
 * @ignore
 */
export type BotOptionsArgument = Partial<Omit<BotOptions, 'prefixes'>> & {
    prefixes: string[] | string;
    clientOptions?: ClientOptions;
};

/**
 * Вспомогательная функция для перевода {@link BotOptionsArgument} в {@link BotOptions}
 * @ignore
 */
export function ParseBotOptionsArgument(optionsArg: BotOptionsArgument): BotOptions {
    let prefixes = optionsArg.prefixes;
    if (typeof prefixes == 'string') {
        prefixes = [ prefixes ];
    }

    let permissions = optionsArg.permissions;
    if (!permissions) {
        permissions = {
            checkAdmin: true,
        };
    }

    return {
        prefixes,
        permissions,
    };
}
