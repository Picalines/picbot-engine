import { PrefixStorage } from "../PrefixStorage";

describe('invalid prefix', () => {
    test('initial test', () => {
        expect(() => new PrefixStorage(['abc test'])).toThrowError("invalid prefix 'abc test'");
        expect(() => new PrefixStorage([''])).toThrowError("invalid prefix ''");
    });

    const prefixes = new PrefixStorage(['!', '&']);

    test('space', () => {
        expect(() => prefixes.add('o e')).toThrowError("invalid prefix 'o e'");
    });

    test('empty', () => {
        expect(() => prefixes.add('')).toThrowError("invalid prefix ''");
    });
});

describe('edit', () => {
    const prefixes = new PrefixStorage(['!']);

    test('add return value', () => {
        expect(prefixes.add('new.')).toBe(true);
        expect(prefixes.add('!')).toBe(false);
    });

    test('add', () => {
        expect(prefixes.list).toEqual(['!', 'new.']);
        expect(prefixes.size).toBe(2);
        prefixes.add('old.');
        expect(prefixes.list).toEqual(['!', 'new.', 'old.']);
        expect(prefixes.size).toBe(3);
    });

    test('remove', () => {
        expect(prefixes.size).toBe(3);
        expect(prefixes.list).toEqual(['!', 'new.', 'old.']);
        prefixes.remove('old.');
        expect(prefixes.list).toEqual(['!', 'new.']);
        expect(prefixes.size).toBe(2);
    });

    test('has', () => {
        expect(prefixes.has('!')).toBe(true);
        expect(prefixes.has('random')).toBe(false);
    });

    describe('invalid prefix remove safe', () => {
        test('space', () => {
            expect(() => prefixes.remove('a b')).not.toThrowError("invalid prefix 'a b'");
        });

        test('empty', () => {
            expect(() => prefixes.remove('')).not.toThrowError("invalid prefix ''");
        });
    });

    test('set', () => {
        prefixes.list = ['!'];
        expect(prefixes.size).toBe(1);
        expect(prefixes.list).toEqual(['!']);
    });

    test('remove before empty', () => {
        expect(prefixes.remove('!')).toBe(false);
        expect(prefixes.size).not.toBe(0);
        expect(prefixes.list).not.toEqual([]);
    });
});

test('iterable', () => {
    const prefixes = new PrefixStorage(['~', '!']);
    const p: string[] = [];
    for (const prefix of prefixes) {
        p.push(prefix);
    }
    expect(p).toContain('~');
    expect(p).toContain('!');
    expect(p.length).toBe(2);
});
