import { State } from "./State";
import { EntityType, Entity } from "../Entity";
import { StateStorage } from "./Storage";
import { assert } from "../../utils";

export interface StateAccess<T> {
    set(value: T): Promise<void>;
    reset(): Promise<void>;
    value(): Promise<T>;
}

export const createStateAccess = <E extends EntityType, T>(state: State<E, T>, storage: StateStorage<E>, entity: Entity<E>): StateAccess<T> => ({
    async set(value) {
        assert(state.validate(value), `value '${value}' is not valid for database state '${state.key}'`);

        await storage.store(entity, state, value);
    },

    async reset() {
        return await storage.delete(entity, state);
    },

    async value() {
        return await storage.restore(entity, state) ?? state.defaultValue;
    },
});
