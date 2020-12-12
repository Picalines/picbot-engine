import { keywordReader, remainingTextReader, wordReader } from "../String";
import { CommandContext } from "../../../command";

const context = null as unknown as CommandContext<unknown[]>;

describe('word', () => {
    test('normal usage', () => {
        expect(wordReader('abc lol', context)).toEqual({ isError: false, value: { length: 3, parsedValue: 'abc' } });
    });

    test('space at begin', () => {
        expect(wordReader(' abc', context)).toEqual({ isError: true, error: 'not found' });
    });

    test('space at end', () => {
        expect(wordReader('abc ', context)).toEqual({ isError: false, value: { length: 3, parsedValue: 'abc' } });
    });

    test('empty string', () => {
        expect(wordReader('', context)).toEqual({ isError: true, error: 'not found' });
    });
});

describe('remainingText', () => {
    test('normal usage', () => {
        expect(remainingTextReader('test abc', context)).toEqual({ isError: false, value: { length: 8, parsedValue: 'test abc' } });
    });

    test('empty string', () => {
        expect(remainingTextReader('', context)).toEqual({ isError: true, error: 'not found' });
    });

    test('spaces', () => {
        expect(remainingTextReader('     ', context)).toEqual({ isError: true, error: 'not found' });
    });

    test('spaces at end', () => {
        expect(remainingTextReader('test abc   ', context)).toEqual({ isError: false, value: { length: 8, parsedValue: 'test abc' } });
    });

    test('spaces at begin', () => {
        expect(remainingTextReader('    test abc', context)).toEqual({ isError: false, value: { length: 8, parsedValue: 'test abc' } });
    });
});

describe('keyword', () => {
    test('normal usage', () => {
        const words = ['a', 'b', 'c'] as const;
        const reader = keywordReader(...words);
        for (const w of words) {
            expect(reader(w + '  ', context)).toEqual({ isError: false, value: { length: 1, parsedValue: w } });
        }
    });

    const reader = keywordReader('add', 'rm');

    test('wrong word', () => {
        expect(reader('test', context)).toEqual({ isError: true, error: 'one of keywords expected: add, rm' });
    });

    test('empty string', () => {
        expect(reader('', context)).toEqual({ isError: true, error: 'one of keywords expected: add, rm' });
    });
});
