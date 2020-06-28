import { GuildMessage, Failable } from "./utils";
import { ClientOptions } from "discord.js";

/**
 * Объект с настройками бота
 */
export type BotOptions = {
    /**
     * Читает префикс в сообщении пользователя
     */
    prefix: (message: GuildMessage) => Failable<number, 'notFound'>;
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
export type BotOptionsArgument = Partial<Omit<BotOptions, 'prefix'>> & {
    prefix: BotOptions['prefix'] | string | string[];
    clientOptions?: ClientOptions;
};

/**
 * Вспомогательная функция для перевода {@link BotOptionsArgument} в {@link BotOptions}
 * @ignore
 */
export function ParseBotOptionsArgument(optionsArg: BotOptionsArgument): BotOptions {
    let prefixReader: BotOptions['prefix'];

    const optionsPrefix = optionsArg.prefix;
    if (typeof optionsPrefix == 'function') {
        prefixReader = optionsPrefix;
    }
    else {
        let prefixes = optionsPrefix instanceof Array ? optionsPrefix : [ optionsPrefix ];
        prefixes = prefixes.map(String.prototype.toLowerCase);

        prefixReader = message => {
            const lowerMessage = message.content.toLowerCase();
            for (const prefix of prefixes) {
                if (lowerMessage.startsWith(prefix)) {
                    return { isError: false, value: prefix.length };
                }
            }
            return { isError: true, error: 'notFound' };
        };
    }

    return {
        prefix: prefixReader,
        permissions: optionsArg.permissions || {
            checkAdmin: true
        },
    };
}
