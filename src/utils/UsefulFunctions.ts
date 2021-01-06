function isPlainObject(obj: any): boolean {
    return typeof obj === 'object' && obj !== null
        && obj.constructor === Object
        && Object.prototype.toString.call(obj) === '[object Object]';
}

export function deepMerge<T>(origin: T, override: Partial<T>): T {
    const copy: T = {} as any;

    for (const key in origin) {
        if (override[key] === undefined) {
            copy[key] = origin[key];
            continue;
        }
        if (isPlainObject(origin[key]) && isPlainObject(override[key])) {
            copy[key] = deepMerge(origin[key], override[key]!);
        }
        else {
            copy[key] = override[key]!;
        }
    }

    return copy;
}

export function* filterIterable<T>(iterable: IterableIterator<T>, filter: (item: T) => boolean): IterableIterator<T> {
    for (const value of iterable) {
        if (filter(value)) {
            yield value;
        }
    }
}

/**
 * @example capitalize('abc') === 'Abc'
 */
export const capitalize = (str: string) => str[0].toUpperCase() + str.slice(1);

/**
 * @example orderedList('a', 'b') === '1. a\n2. b'
 */
export const orderedList = (...elements: readonly string[]) => elements.map((element, index) => `${index + 1}. ${element.trim()}`).join('\n');

/**
 * @example unorderedList('a', 'b') === '• a\n• b'
 */
export const unorderedList = (...elements: readonly string[]) => elements.map(element => '• ' + element.trim()).join('\n');

/**
 * @example parseInterval(1, 100) === '[1; 100]'
 * @example parseInterval(1, Infinity) === '[1; +∞)'
 * @example parseInterval(-Infinity, 0) === '(-∞; 0]'
 * @example parseInterval(5, 0) === '∅'
 * @example parseInterval(0, 0) === '{0}'
 */
export const parseInterval = (min: number, max: number) => {
    if (min == max) return `{${min}}`;
    if (min > max) return '∅';

    const inf = (n: number) => (n < 0 ? '-' : '+') + '∞';

    const left = isFinite(min) ? `[${min}` : `(${inf(min)}`;
    const right = isFinite(max) ? `${max}]` : `${inf(max)})`;

    return left + '; ' + right;
}

export function assert(condition: any, message = "assertion failed"): asserts condition {
    if (!condition) {
        throw new Error(message);
    }
}
