import { GuildMember, Role, TextChannel } from "discord.js";
import { GuildMessage } from "./utils";

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

export class NumberReader extends RegexReader {
    constructor() {
        super(`\\d+(\\.\\d+)?`);
    }
}

export class NumberParser implements ArgumentParser<number> {
    parse(value: string) {
        try {
            return parseFloat(value);
        }
        catch {
            throw new SyntaxError('invalid number');
        }
    }
}

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

export class MemberMentionReader extends RegexReader {
    constructor() {
        super('<@\\!?\\d+>');
    }
}

export class MemberMentionParser extends MentionParser<GuildMember> {
    constructor() {
        super((msg, id) => msg.guild.member(id));
    }
}

export class RoleMentionReader extends RegexReader {
    constructor() {
        super('<@&\\d+>');
    }
}

export class RoleMentionParser extends MentionParser<Role> {
    constructor() {
        super((msg, id) => msg.guild.roles.cache.find(r => r.id == id));
    }
}

export class TextChannelMentionReader extends RegexReader {
    constructor() {
        super('<#(?<id>\\d+)>');
    }
}

export class TextChannelMentionParser extends MentionParser<TextChannel> {
    constructor() {
        super((msg, id) => msg.guild.channels.cache.find(
            ch => ch.type == 'text' && ch.id == id
        ) as TextChannel | undefined);
    }
}
