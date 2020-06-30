import { ClientOptions } from "discord.js";

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
};

/**
 * Аргумент настроек бота в его конструкторе
 * @ignore
 */
export type BotOptionsArgument = Partial<BotOptions> & {
    clientOptions?: ClientOptions;
};

/**
 * Вспомогательная функция для перевода {@link BotOptionsArgument} в {@link BotOptions}
 * @ignore
 */
export function ParseBotOptionsArgument(optionsArg: BotOptionsArgument): BotOptions {
    let permissions = optionsArg.permissions;
    if (!permissions) {
        permissions = {
            checkAdmin: true,
        };
    }

    return {
        permissions,
        ignoreBots: optionsArg.ignoreBots ?? true,
    };
}
