import { StateAccess } from '../Access';

export const numberAccess = (access: StateAccess<number>) => ({
    ...access,

    async increase(delta: number) {
        const newValue = (await access.value()) + delta;
        await access.set(newValue);
        return newValue;
    },

    async decrease(delta: number) {
        const newValue = (await access.value()) - delta;
        await access.set(newValue);
        return newValue;
    },
});
