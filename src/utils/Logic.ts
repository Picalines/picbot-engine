/**
 * Вспомогательный тип для функций. Если какая-то операция прошла успешно,
 * функция возвращает объект этого типа со значениями `isError: false, value: R`.
 * Иначе `isError: true, error: E`
 */
export type Failable<R, E> = {
    isError: true,
    error: E,
} | {
    isError: false,
    value: R,
};

/**
 * Интерфейс функции, которая переводит значение From в To
 * @returns [[Failable]].
 */
export interface ValueParser<From, To, Context, Error> {
    (value: From, context: Context): Failable<To, Error>;
}
