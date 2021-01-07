import { StateAccess } from "./Access";
import { EntityType } from "../Entity";
import { assert } from "../../utils";

interface StateDefinition<E extends EntityType, T, A extends StateAccess<T>> {
    readonly key: string;
    readonly entityType: E;
    readonly defaultValue: T;
    validate(value: T): boolean;
    readonly accessFabric?: (access: StateAccess<T>) => A;
}

export interface State<E extends EntityType, T, A extends StateAccess<T> = StateAccess<T>> extends StateDefinition<E, T, A> { }

export class State<E extends EntityType, T, A extends StateAccess<T> = StateAccess<T>> {
    constructor(definition: StateDefinition<E, T, A>) {
        Object.assign(this, definition);

        assert(this.key && !this.key.includes(' '), `property key '${this.key}' is invalid (empty or includes spaces)`);
        assert(this.validate(this.defaultValue), `default value of property '${this.key}' is invalid (validate returned false)`);
    }
}

export type AnyState<E extends EntityType = EntityType> = State<E, any>;
