import { assert } from "../../../utils/index.js";
import { EntityType } from "../../Entity.js";
import { StateAccess, StateAccessDecorator } from "../State.js";
import { jsonAccess } from "./Json.js";

export const jsonModelAccess = <T>(constructor: new () => T): StateAccessDecorator<EntityType, string, StateAccess<T>> => access => {
    const jAccess = jsonAccess<T>(access);

    return {
        ...jAccess,

        async set(model: T) {
            assert(model instanceof constructor, `${constructor.name} instance expected`);
            await jAccess.set(model);
        },

        /**
         * @warning to save changes use `.set(object)`
         */
        async value() {
            const value = await jAccess.value();
            return Object.assign(new constructor(), value) as T;
        },
    };
};
