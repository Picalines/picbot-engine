import { assert } from "../../../utils/index.js";
import { EntityType } from "../../Entity.js";
import { StateAccess, StateAccessDecorator } from "../State.js";

/**
 * @param range default is [-Infinity, Infinity]
 * @param range default is false
 */
export const numberAccess = (range?: [min: number, max: number], allowNaN = false): StateAccessDecorator<EntityType, number> => {
    assert(!range || range[1] > range[0], `${numberAccess.name} range is invalid`);

    const inRange = range
        ? ((n: number) => n >= range[0] && n <= range[1])
        : () => true;

    const isValid = !allowNaN
        ? ((n: number) => !isNaN(n) && inRange(n))
        : inRange;

    return (access: StateAccess<number>) => ({
        ...access,

        async set(value: number) {
            assert(isValid(value), `number '${value}' is not valid`);
            await access.set(value);
        },

        async increase(delta: number) {
            const newValue = (await this.value()) + delta;
            await this.set(newValue);
            return newValue;
        },

        async decrease(delta: number) {
            const newValue = (await this.value()) - delta;
            await this.set(newValue);
            return newValue;
        },
    });
};
