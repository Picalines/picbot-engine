import { assert } from "../../../utils/index.js";
import { AnyEntity } from "../../Entity.js";
import { StateAccess } from "../State.js";

interface Options<T, R> {
    isValid?(value: R): Promise<boolean>;
    serialize(value: R): Promise<T>;
    deserialize(stored: T): Promise<R | null>;
}

interface OptionsGetter<T, R, E extends AnyEntity> {
    (entity: E): Options<T, R>;
}

export const referenceAccess = <T, R, E extends AnyEntity>(optionsGetter: OptionsGetter<T, R, E>) => (access: StateAccess<T>, entity: E, defaultValue: T) => {
    const { isValid, serialize, deserialize } = optionsGetter(entity);

    return {
        ...access,

        async value(): Promise<R | null> {
            const stored = await access.value();
            if (stored === defaultValue) {
                return null;
            }

            const user = await deserialize(stored);

            if (user == null && stored != null) {
                await this.set(null);
                return null;
            }

            return await deserialize(stored);
        },

        async set(value: R | null) {
            if (value === null) {
                await access.set(defaultValue);
                return;
            }

            if (isValid) {
                assert(await isValid(value), "reference value is not valid");
            }

            await access.set(await serialize(value));
        },
    };
};
