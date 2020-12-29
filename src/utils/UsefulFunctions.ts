import { FilterFunction, NonEmptyReadonly } from "./UsefulTypes";

/**
 * @returns true, если строка не пустая и не содержит пробелов
 * @param string строка
 */
export function validateIdentifier(string: string): boolean {
    return string.length > 0 && !string.includes(' ');
}

/**
 * Является ли объект литералом (скорее всего)
 * @param obj объект
 */
function isPlainObject(obj: any): boolean {
    return typeof obj === 'object' && obj !== null
        && obj.constructor === Object
        && Object.prototype.toString.call(obj) === '[object Object]';
}

/**
 * @param origin оригинальный объект
 * @param override объект со значениями для переписывания оригинала
 */
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

/**
 * Функция фильтрации, используящая генератор
 * @param iterable итерируемый объект
 * @param filter функция фильтрации
 */
export function* filterIterable<T>(iterable: IterableIterator<T>, filter: FilterFunction<T>): IterableIterator<T> {
    for (const value of iterable) {
        if (filter(value)) {
            yield value;
        }
    }
}

export const capitalize = (str: string) => str[0].toUpperCase() + str.slice(1);

export const orderedList = (...elements: readonly string[]) => elements.map((element, index) => `${index + 1}. ${element.trim()}`).join('\n');

export const unorderedList = (...elements: readonly string[]) => elements.map(element => '• ' + element.trim()).join('\n');

export function assert(condition: any, message?: string): asserts condition {
    if (!condition) {
        throw new Error(message || "assertion failed");
    }
}
