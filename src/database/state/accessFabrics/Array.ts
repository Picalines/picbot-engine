import { StateAccess } from "../Access.js";

export const arrayAccess = <T>(access: StateAccess<readonly T[]>) => ({
    ...access,

    async item(index: number): Promise<T | undefined> {
        return (await access.value())[index];
    },

    async push(...items: T[]) {
        const old = await access.value();
        await access.set([...old, ...items]);
    },

    async unshift(...items: T[]) {
        const old = await access.value();
        await access.set([...items, ...old]);
    },

    async pop() {
        const array = [...await access.value()];
        const last = array.pop();
        await access.set(array);
        return last;
    },

    async shift() {
        const array = [...await access.value()];
        const last = array.shift();
        await access.set(array);
        return last;
    },
});
