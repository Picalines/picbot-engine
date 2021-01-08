import { Disposable } from "../utils/index.js";

export interface EventListener<Emitter, Args extends any[]> {
    (this: Emitter, ...args: Args): any;
}

export type ListenerOf<Emitter, Events, E extends keyof Events> = EventListener<Emitter, Events[E] extends (...args: infer Args) => void ? Args : never>;

export interface EventStorage<Emitter, Events> {
    readonly names: (keyof Events)[];

    /**
     * @returns .dispose() will call [[EventStorage.off]]
     */
    on<E extends keyof Events>(name: E, listener: ListenerOf<Emitter, Events, E>): Disposable;

    once<E extends keyof Events>(name: E, listener: ListenerOf<Emitter, Events, E>): void;

    off<E extends keyof Events>(name: E, listener: ListenerOf<Emitter, Events, E>): boolean;
}

export interface EmitEvent<Emitter, Events> {
    <E extends keyof Events>(name: E, ...args: Events[E] extends EventListener<Emitter, infer Args> ? Args : never): void;
}

export interface PublicEventStorage<Events, UnsafeEmitter = any> extends EventStorage<UnsafeEmitter, Events> {
    readonly emit: EmitEvent<UnsafeEmitter, Events>;
}
