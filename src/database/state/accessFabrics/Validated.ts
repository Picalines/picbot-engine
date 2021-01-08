import { assert } from "../../../utils/index.js";
import { AnyEntity } from "../../Entity.js";
import { StateAccess } from "../Access.js";

export const validatedAccess = <T>(validator: (value: T) => boolean) => (access: StateAccess<T>, entity: AnyEntity) => ({
    ...access,

    async set(value: T) {
        assert(validator(value), `${'guild' in entity ? 'member' : 'guild'} state value '${value}' is not valid`);
        await access.set(value);
    },
});
