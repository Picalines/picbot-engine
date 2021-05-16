import { assert } from "../../../utils/index.js";
import { StateAccess } from "../State.js";
import { jsonAccess } from "./Json.js";

export const jsonModelAccess = <T>(modelConstructor: new () => T) => (access: StateAccess<string>) => {
    const jAccess = jsonAccess<T>(access);

    return {
        ...jAccess,

        async set(model: T) {
            assert(model instanceof modelConstructor, `${modelConstructor.name} instance expected`);
            await jAccess.set(model);
        },

        /**
         * @warning to save changes use `.set(object)`
         */
        async value() {
            const value = await jAccess.value();
            const instance = Object.assign(new modelConstructor(), value) as T;
            return instance;
        },
    };
};
