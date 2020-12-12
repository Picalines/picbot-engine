import { PropertyAccess } from './Access';

/**
 * Объект доступа к числовому свойству
 */
export class NumberPropertyAccess extends PropertyAccess<number> {
    /**
     * Увеличивает числовое свойство на `delta`
     * @param delta на сколько увеличить свойство
     */
    async increase(delta: number): Promise<number> {
        const newValue = (await this.value()) + delta;
        await this.set(newValue);
        return newValue;
    }

    /**
     * Уменьшает числовое свойство на `delta`
     * @param delta на сколько уменьшить свойство
     */
    async decrease(delta: number): Promise<number> {
        const newValue = (await this.value()) - delta;
        await this.set(newValue);
        return newValue;
    }
}
