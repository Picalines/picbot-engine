import { PropertyAccess } from './Access';

export class NumberPropertyAccess extends PropertyAccess<number> {
    async increase(delta: number): Promise<number> {
        const newValue = (await this.value()) + delta;
        await this.set(newValue);
        return newValue;
    }

    async decrease(delta: number): Promise<number> {
        const newValue = (await this.value()) - delta;
        await this.set(newValue);
        return newValue;
    }
}
