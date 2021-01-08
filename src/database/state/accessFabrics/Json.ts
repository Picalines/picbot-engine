import { StateAccess } from "../Access.js";

export const jsonAccess = (access: StateAccess<string>) => ({
    ...access,

    async set(value: string) {
        try {
            JSON.parse(value);
        }
        catch {
            throw new Error('json is not valid');
        }
        await access.set(value);
    },

    async parsed() {
        return JSON.parse(await access.value());
    },

    async setJson(object: any) {
        await access.set(JSON.stringify(object));
    },

    async assignJson(source: any) {
        await access.set(Object.assign(await this.parsed(), source));
    },
});
