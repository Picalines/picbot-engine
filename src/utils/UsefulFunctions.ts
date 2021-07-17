import { AnyConstructor, PrimitiveConstructor, PrimitiveConstructorInstance } from "./UsefulTypes.js";

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
};

type UnwrappedInstanceType<C extends AnyConstructor>
    = C extends PrimitiveConstructor
    ? PrimitiveConstructorInstance<C>
    : InstanceType<C>;

/**
 * Type checker hint
 * @param _types list of constructor functions (ignored at runtime)
 * @example nulled(Number) // returns null at runtime, gives (null | number) type at "compile" time
 * @returns null
 */
export function nulled<Types extends AnyConstructor[]>(..._types: Types):
    null | { [I in keyof Types]: Types[I] extends AnyConstructor ? UnwrappedInstanceType<Types[I]> : never }[number] {
    return null;
}

/**
 * Type checker hint
 * @example nullable(123) // returns 123 at runtime, gives (123 | null) type at "compile" time
 */
export function nullable<T>(value: T): T | null {
    return value;
}
