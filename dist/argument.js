"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Объединяет в себе методы `ArgumentReader` и `ArgumentParser`
 * Используется в объявлении команды
 */
class Argument {
}
exports.Argument = Argument;
/**
 * Ключевое слово
 * Пример: `!get info`, где `info` - ключевое слово
 * ```js
 * new KeywordArgument('info');
 * ```
 */
class KeywordArgument extends Argument {
    constructor(keyword) {
        super();
        this.keyword = keyword;
    }
    read(input) {
        return input.startsWith(this.keyword) ? this.keyword.length : 0;
    }
    parse(input) {
        return input;
    }
}
exports.KeywordArgument = KeywordArgument;
/**
 * Сокращение для аргументов, у которых нужно проверить
 * каждый символ по отдельности
 */
class CharReader {
    read(input) {
        let i = 0;
        while (i < input.length && this.condition(input[i], i, input.substring(0, i)))
            i++;
        return i;
    }
}
exports.CharReader = CharReader;
/**
 * Весь оставшийся текст сообщения
 */
class RemainingTextArgument extends Argument {
    read(input) {
        return input.length;
    }
    parse(value) {
        return value;
    }
}
exports.RemainingTextArgument = RemainingTextArgument;
class RegexReader {
    constructor(regex) {
        this.regex = new RegExp('^' + regex, 'i');
    }
    read(input) {
        const matches = input.match(this.regex);
        return matches && matches[0] ? matches[0].length : 0;
    }
}
exports.RegexReader = RegexReader;
class SpaceReader extends RegexReader {
    constructor() {
        super('\\s+');
    }
}
exports.SpaceReader = SpaceReader;
class RegexArgument extends Argument {
    constructor(regex) {
        super();
        this.regex = regex;
        this.regexReader = new RegexReader(regex);
    }
    read(input) {
        return this.regexReader.read(input);
    }
}
exports.RegexArgument = RegexArgument;
class NumberArgument extends RegexArgument {
    constructor(type) {
        super(`\\d+${type == 'float' ? '(\\.\\d+)?' : ''}`);
        this.type = type;
    }
    parse(value) {
        return this.type == 'integer' ? parseInt(value) : parseFloat(value);
    }
}
exports.NumberArgument = NumberArgument;
class MemberArgument extends RegexArgument {
    constructor() {
        super('<@\\!?\\d+>');
    }
    parse(value, msg) {
        var _a;
        const id = value.match(/\d+/)[0];
        const member = (_a = msg.guild) === null || _a === void 0 ? void 0 : _a.member(id);
        if (!member)
            throw null;
        return member;
    }
}
exports.MemberArgument = MemberArgument;
