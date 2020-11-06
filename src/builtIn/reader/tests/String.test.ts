import { keywordReader, remainingTextReader, wordReader } from "../String";
import { GuildMessage } from "../../../utils";

const nullMessage = null as unknown as GuildMessage;

describe('word', () => {
    test('normal usage', () => {
        expect(wordReader('abc lol', nullMessage)).toEqual({ isError: false, value: { length: 3, parsedValue: 'abc' } });
    });

    test('space at begin', () => {
        expect(wordReader(' abc', nullMessage)).toEqual({ isError: true, error: 'notFound' });
    });

    test('space at end', () => {
        expect(wordReader('abc ', nullMessage)).toEqual({ isError: false, value: { length: 3, parsedValue: 'abc' } });
    });

    test('empty string', () => {
        expect(wordReader('', nullMessage)).toEqual({ isError: true, error: 'notFound' });
    });
});

describe('remainingText', () => {
    test('normal usage', () => {
        expect(remainingTextReader('test abc', nullMessage)).toEqual({ isError: false, value: { length: 8, parsedValue: 'test abc' } });
    });

    test('empty string', () => {
        expect(remainingTextReader('', nullMessage)).toEqual({ isError: true, error: 'notFound' });
    });

    test('spaces', () => {
        expect(remainingTextReader('     ', nullMessage)).toEqual({ isError: true, error: 'notFound' });
    });

    test('spaces at end', () => {
        expect(remainingTextReader('test abc   ', nullMessage)).toEqual({ isError: false, value: { length: 8, parsedValue: 'test abc' } });
    });

    test('spaces at begin', () => {
        expect(remainingTextReader('    test abc', nullMessage)).toEqual({ isError: false, value: { length: 8, parsedValue: 'test abc' } });
    });
});

describe('keyword', () => {
    test('normal usage', () => {
        const words = ['a', 'b', 'c'] as const;
        const reader = keywordReader(...words);
        for (const w of words) {
            expect(reader(w + '  ', nullMessage)).toEqual({ isError: false, value: { length: 1, parsedValue: w } });
        }
    });

    const reader = keywordReader('add', 'rm');

    test('wrong word', () => {
        expect(reader('test', nullMessage)).toEqual({ isError: true, error: { message: 'one of keywords expected: add, rm' } });
    });

    test('empty string', () => {
        expect(reader('', nullMessage)).toEqual({ isError: true, error: { message: 'one of keywords expected: add, rm' } });
    });
});
