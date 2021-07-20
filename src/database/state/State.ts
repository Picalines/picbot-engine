import { Entity, EntityType } from "../Entity.js";
import { assert } from "../../utils/index.js";

export interface StateAccess<T> {
    set(value: T): Promise<void>;
    value(): Promise<T>;
}

export interface StateAccessDecorator<E extends EntityType, T, A = StateAccess<T>> {
    (baseAccess: StateAccess<T>, entity: Entity<E>, defaultState: T): A;
}

interface Definition<E extends EntityType, T, A> {
    readonly name: string;
    readonly entityType: E;
    readonly defaultValue: T;
    readonly accessDecorator?: StateAccessDecorator<E, T, A>;
}

export interface State<E extends EntityType, T, A = StateAccess<T>> extends Definition<E, T, A> { }

export class State<E extends EntityType, T, A = StateAccess<T>> {
    constructor(definition: Definition<E, T, A>) {
        Object.assign(this, definition);
        assert(this.name && !this.name.includes(' '), `state name '${this.name}' is invalid (empty or includes spaces)`);
        Object.freeze(this);
    }
}
