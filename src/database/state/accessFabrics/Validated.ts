import { assert } from "../../../utils/index.js";
import { Entity } from "../../Entity.js";
import { StateAccess } from "../State.js";

export const validatedAccess = <T>(validator: (value: T) => boolean) => (access: StateAccess<T>, entity: Entity<any>) => ({
    ...access,

    async set(value: T) {
        assert(validator(value), `${'guild' in entity ? 'member' : 'guild'} state value '${value}' is not valid`);
        await access.set(value);
    },
});
