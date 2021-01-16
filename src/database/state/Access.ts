import { State } from "./State.js";
import { EntityType, Entity } from "../Entity.js";
import { StateStorage } from "./Storage.js";

export interface StateAccess<T> {
    set(value: T): Promise<void>;
    reset(): Promise<void>;
    value(): Promise<T>;
}

export const createStateBaseAccess = <E extends EntityType, T>(state: State<E, T>, storage: StateStorage<E>, entity: Entity<E>): StateAccess<T> => {
    const entityState = storage.entity(entity);
    return {
        async set(value) {
            await entityState.store(state, value);
        },

        async reset() {
            return await entityState.reset(state);
        },

        async value() {
            return await entityState.restore(state) ?? state.defaultValue;
        },
    };
}
