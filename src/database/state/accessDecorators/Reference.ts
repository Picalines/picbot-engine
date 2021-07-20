import { assert } from "../../../utils/index.js";
import { Entity, EntityType } from "../../Entity.js";
import { StateAccess, StateAccessDecorator } from "../State.js";

interface Options<S, R> {
    isValid?(value: R): Promise<boolean>;
    serialize(value: R): Promise<S>;
    deserialize(stored: S): Promise<R | null>;
}

interface OptionsGetter<E extends EntityType, S, R> {
    (entity: Entity<E>): Options<S, R>;
}

export const referenceAccess = <E extends EntityType, S, R>(getOptions: OptionsGetter<E, S, R>): StateAccessDecorator<E, S, StateAccess<R | null>> => (access, entity, defaultValue) => {
    const { isValid, serialize, deserialize } = getOptions(entity);

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
