import { Property } from "../../database/property/Property";
import { EntityType } from "../../database/Entity";
import { PropertyAccess } from "../../database/property/Access";

export class NumberPropertyAccess extends PropertyAccess<number> {
    constructor(property: Property<EntityType, number, PropertyAccess<number>>, methods: any) {
        super(property, methods);
    }

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