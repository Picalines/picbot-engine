import { StateAccess } from "../State.js";

export const jsonAccess = <T = any>(access: StateAccess<string>) => ({
    ...access,

    async set(object: T) {
        await access.set(JSON.stringify(object))
    },

    /**
     * @warning to save changes use `.set(object)` or prefer `.modify(obj => ...)`
     */
    async value(): Promise<T> {
        const value = await access.value();

        try {
            return JSON.parse(value);
        }
        catch {
            throw new Error('stored json is not valid');
        }
    },
});
