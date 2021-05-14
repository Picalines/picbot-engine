import { StateAccess } from "../State.js";

export const jsonAccess = <T = any>(access: StateAccess<string>) => ({
    ...access,

    async set(object: T) {
        await access.set(JSON.stringify(object))
    },

    async value(): Promise<T> {
        const value = await access.value();

        try {
            return JSON.parse(value);
        }
        catch {
            throw new Error('stored json is not valid');
        }
    },

    /**
     * uses Object.assing
     */
    async assign(object: Partial<T>) {
        await this.set(Object.assign(await this.value(), object));
    },
});
