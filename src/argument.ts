import { GuildMember, Message, Guild, Role, TextChannel } from "discord.js";

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
    parse(value: string, msg: Message): T;
}

/**
 * Объединяет в себе методы `ArgumentReader` и `ArgumentParser`
 * Используется в объявлении команды
 */
export abstract class Argument<TValue> implements ArgumentParser<TValue> {
    abstract read(input: string): number;
    abstract parse(value: string, msg: Message): TValue;
}

/**
 * Ключевое слово
 * Пример: `!get info`, где `info` - ключевое слово
 * ```js
 * new KeywordArgument('info');
 * ```
 */
export class KeywordArgument extends Argument<string> {
    constructor(public readonly keyword: string) { super() }

    read(input: string) {
        return input.startsWith(this.keyword) ? this.keyword.length : 0;
    }

    parse(input: string) {
        return input;
    }
}

/**
 * Сокращение для аргументов, у которых нужно проверить
 * каждый символ по отдельности
 */
export abstract class CharReader implements ArgumentReader {
    /**
     * Если метод вернёт false, то чтение аргумента
     * остановится. Итоговая длина токена равна
     * кол-ву вызовов метода `condition`
     * 
     * Также встоена проверка на окончание сообщения
     * (защита от index out of bounds)
     * 
     * @param char символ для проверки
     * @param index индекс символа (от 0 до N)
     * @param processed строка, уже прошедшая проверку этого метода
     */
    abstract condition(char: string, index: number, processed: string): boolean;

    read(input: string) {
        let i = 0;
        while (i < input.length && this.condition(input[i], i, input.substring(0, i))) i++;
        return i;
    }
}

/**
 * Весь оставшийся текст сообщения
 */
export class RemainingTextArgument extends Argument<string> {
    read(input: string): number {
        return input.length;
    }

    parse(value: string): string {
        return value;
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
 * Абстрактный класс аргумента, читающийся с помощью
 * регулярного выражения
 */
export abstract class RegexArgument<T> extends Argument<T> {
    public readonly regexReader: RegexReader;

    constructor(
        public readonly regex: string
    ) {
        super();
        this.regexReader = new RegexReader(regex);
    }

    read(input: string) {
        return this.regexReader.read(input);
    }
}

/**
 * Числовой аргумент. В конструкторе можно настроить
 * тип числа (целое / вещественное)
 */
export class NumberArgument extends RegexArgument<number> {
    constructor(
        public readonly type: 'integer' | 'float'
    ) {
        super(`\\d+${type == 'float' ? '(\\.\\d+)?' : ''}`);
    }

    parse(value: string) {
        try {
            return this.type == 'integer' ? parseInt(value) : parseFloat(value);
        }
        catch {
            throw new SyntaxError('invalid number');
        }
    }
}

/**
 * Абстрактный класс аргумента упоминания
 */
export abstract class MentionArgument<T> extends RegexArgument<T> {
    constructor(
        regex: string,
        readonly extract: (msg: Message & { guild: Guild }, id: string) => T | null | undefined
    ) {
        super(regex);
    }

    parse(value: string, msg: Message) {
        if (!msg.guild) {
            throw new TypeError('dm message');
        }
        const id = (value.match(/\d+/) as RegExpMatchArray)[0];
        try {
            const obj = this.extract(msg as Message & { guild: Guild }, id);
            if (!obj) {
                throw undefined;
            }
            return obj;
        }
        catch {
            throw new SyntaxError('invalid mention');
        }
    }
}

/**
 * Аргумент упоминания участника сервера
 */
export class MemberArgument extends MentionArgument<GuildMember> {
    constructor() {
        super('<@\\!?\\d+>', (msg, id) => msg.guild.member(id));
    }
}

/**
 * Аргумент упоминания роли
 */
export class RoleArgument extends MentionArgument<Role> {
    constructor() {
        super('<@&\\d+>', (msg, id) => msg.guild.roles.cache.find(r => r.id == id));
    }
}

/**
 * Аргумент упоминания текстового канала
 */
export class TextChannelArgument extends MentionArgument<TextChannel> {
    constructor() {
        super('<#(?<id>\\d+)>', (msg, id) => msg.guild.channels.cache.find(
            ch => ch.type == 'text' && ch.id == id
        ) as TextChannel | undefined);
    }
}
