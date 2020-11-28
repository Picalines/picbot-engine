import { Disposable } from "../utils";

/**
 * Интерфейс функции слушателя события
 */
export interface EventListener<Args extends any[]> {
    (...args: Args): any;
}

type DefinitionToListener<Events, E extends keyof Events> = EventListener<Events[E] extends (...args: infer Args) => void ? Args : never>;

/**
 * Интерфейс хранилища событий
 */
export interface EventStorage<Events> {
    /**
     * Имена событий
     */
    readonly names: (keyof Events)[];

    /**
     * Подписывает вызов функции на событие
     * @param name имя события
     * @param listener слушатель события
     * @returns объект, с помощью которого можно отписать listener
     */
    on<E extends keyof Events>(name: E, listener: DefinitionToListener<Events, E>): Disposable;

    /**
     * Подписывает вызов функции на событие (функция будет вызвана только 1 раз)
     * @param name имя события
     * @param listener слушатель события
     */
    once<E extends keyof Events>(name: E, listener: DefinitionToListener<Events, E>): void;

    /**
     * Отписывает вызов функции на событие
     * @param name имя события
     * @param listener слушатель события
     * @returns true, если слушатель события был успешно отписан
     */
    off<E extends keyof Events>(name: E, listener: DefinitionToListener<Events, E>): boolean;
}

/**
 * Интерфейс функции вызова события из хранилища
 */
export interface EmitEvent<Events> {
    /**
     * Вызывает событие
     * @param name имя события
     * @param args аргументы события
     */
    <E extends keyof Events>(name: E, ...args: Events[E] extends EventListener<infer Args> ? Args : never): void;
}

/**
 * Интерфейс публичного хранилища событий (любые части программы могут вызывать emit)
 */
export interface PublicEventStorage<Events> extends EventStorage<Events> {
    readonly emit: EmitEvent<Events>;
}

/**
 * Достаёт объявления событий класса
 */
export type EventsOf<S extends EventStorage<any>> = S extends EventStorage<infer Events> ? Events : never;

export type EmitOf<S extends EventStorage<any>> = EmitEvent<EventsOf<S>>;
