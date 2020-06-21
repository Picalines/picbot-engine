import { GuildMember, Role, TextChannel } from "discord.js";
import { GuildMessage } from "./utils";

/**
 * Интерфейс объекта, читающего аргумент в сообщении пользователя
 */
export interface ArgumentReader {
    /**
     * Метод возвращает длину нужного токена,
     * если input с него начинается. Иначе следует
     * вернуть 0
     * 
     * @param input непрочитанная часть сообщения с командой
     * @returns длина токена в input (иначе 0)
     */
    read(input: string): number;
}

/**
 * @template T
 * Интерфейс объекта, приводящего строчный ввод пользователя к типу `T`
 */
export interface ArgumentParser<T> {
    /**
     * Метод переводит строковое значение `value` в
     * новый тип данных `T`
     * 
     * @param value часть сообщения с командой, которую
     * до этого прочитал `ArgumentReader`
     * @returns новое значение типа `T`
     */
    parse(value: string, message: GuildMessage): T;
}

/**
 * Читает оставшийся текст сообщения
 */
export class RemainingTextReader implements ArgumentReader {
    read(input: string): number {
        return input.length;
    }
}

export class RamainingTextParser implements ArgumentParser<string> {
    parse(text: string, _: GuildMessage): string {
        return text.trim();
    }
}

/**
 * Читает аргумент с помощью регулярного выражения
 */
export class RegexReader implements ArgumentReader {
    public readonly regex: RegExp;

    constructor(regex: string) {
        this.regex = new RegExp('^' + regex, 'i');
    }

    read(input: string) {
        const matches = input.match(this.regex);
        return matches && matches[0] ? matches[0].length : 0;
    }
}

/**
 * Читает пробел в сообщении
 */
export class SpaceReader extends RegexReader {
    constructor() {
        super('\\s+');
    }
}

/**
 * Читает число (положительное / отрицательное, с дробной частью / целое)
 */
export class NumberReader extends RegexReader {
    constructor() {
        super(`[+-]?\\d+(\\.\\d+)?`);
    }
}

/**
 * Переводит строку в число (в случае `isNaN` кидает `SyntaxError`)
 */
export class NumberParser implements ArgumentParser<number> {
    parse(value: string) {
        const number = parseFloat(value);
        if (isNaN(number)) {
            throw new SyntaxError(`'${value}' is not a number`);
        }
        return number;
    }
}

/**
 * Абстрактный класс для парсеров упоминаний discord'а
 */
export abstract class MentionParser<T> implements ArgumentParser<T> {
    constructor(
        readonly extract: (msg: GuildMessage, id: string) => T | null | undefined
    ) { }

    parse(mention: string, msg: GuildMessage) {
        const idMatches = mention.match(/\d+/);
        try {
            if (idMatches) {
                const mentionedObj = this.extract(msg, idMatches[0]);
                if (mentionedObj) {
                    return mentionedObj;
                }
            }
        }
        finally {
            throw new SyntaxError('invalid mention');
        }
    }
}

/**
 * Читает упоминание участника сервера
 */
export class MemberMentionReader extends RegexReader {
    constructor() {
        super('<@\\!?\\d+>');
    }
}

/**
 * Получает участника сервера через его упоминание
 */
export class MemberMentionParser extends MentionParser<GuildMember> {
    constructor() {
        super((msg, id) => msg.guild.member(id));
    }
}

/**
 * Читает упоминание роли
 */
export class RoleMentionReader extends RegexReader {
    constructor() {
        super('<@&\\d+>');
    }
}

/**
 * Получает роль через её упоминание
 */
export class RoleMentionParser extends MentionParser<Role> {
    constructor() {
        super((msg, id) => msg.guild.roles.cache.find(r => r.id == id));
    }
}

/**
 * Читает упоминание текстового канала
 */
export class TextChannelMentionReader extends RegexReader {
    constructor() {
        super('<#(?<id>\\d+)>');
    }
}

/**
 * Получает текстовый канал по его упоминанию
 */
export class TextChannelMentionParser extends MentionParser<TextChannel> {
    constructor() {
        super((msg, id) => msg.guild.channels.cache.find(
            ch => ch.type == 'text' && ch.id == id
        ) as TextChannel | undefined);
    }
}
