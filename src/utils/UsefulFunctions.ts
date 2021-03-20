export function assert(condition: any, message = "assertion failed"): asserts condition {
    if (!condition) {
        throw new Error(message);
    }
}

/**
 * @example capitalize('abc') === 'Abc'
 * @example capitalize('') == ''
 */
export const capitalize = (str: string) => (str.length > 0) ? str[0]!.toUpperCase() + str.slice(1) : '';

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
    if (min > max || isNaN(min) || isNaN(max)) return '∅';

    const inf = (n: number) => (n < 0 ? '-' : '+') + '∞';

    const left = isFinite(min) ? `[${min}` : `(${inf(min)}`;
    const right = isFinite(max) ? `${max}]` : `${inf(max)})`;

    return left + '; ' + right;
}
