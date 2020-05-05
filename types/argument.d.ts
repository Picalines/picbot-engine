import { GuildMember, Message } from "discord.js";
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
export declare abstract class Argument<TValue> implements ArgumentParser<TValue> {
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
export declare class KeywordArgument extends Argument<string> {
    readonly keyword: string;
    constructor(keyword: string);
    read(input: string): number;
    parse(input: string): string;
}
/**
 * Сокращение для аргументов, у которых нужно проверить
 * каждый символ по отдельности
 */
export declare abstract class CharReader implements ArgumentReader {
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
    read(input: string): number;
}
/**
 * Весь оставшийся текст сообщения
 */
export declare class RemainingTextArgument extends Argument<string> {
    read(input: string): number;
    parse(value: string): string;
}
export declare class RegexReader implements ArgumentReader {
    readonly regex: RegExp;
    constructor(regex: string);
    read(input: string): number;
}
export declare class SpaceReader extends RegexReader {
    constructor();
}
export declare abstract class RegexArgument<T> extends Argument<T> {
    readonly regex: string;
    readonly regexReader: RegexReader;
    constructor(regex: string);
    read(input: string): number;
}
export declare class NumberArgument extends RegexArgument<number> {
    readonly type: 'integer' | 'float';
    constructor(type: 'integer' | 'float');
    parse(value: string): number;
}
export declare class MemberArgument extends RegexArgument<GuildMember> {
    constructor();
    parse(value: string, msg: Message): GuildMember;
}
