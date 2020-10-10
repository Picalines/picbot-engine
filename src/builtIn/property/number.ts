import { Entity as Entity, Property, PropertyDefinition } from "../../database/Property/Definition";
import { PropertyAccess } from "../../database/Property/Access";

export class NumberPropertyAccess extends PropertyAccess<number> {
    constructor(property: Property<Entity, number, PropertyAccess<number>>, methods: any) {
        super(property, methods);
    }

    /**
     * Увеличивает числовое свойство на `delta`
     * @param delta на сколько увеличить свойство
     */
    async increase(delta: number) {
        const newValue = (await this.value()) + delta;
        await this.set(newValue);
    }

    /**
     * Уменьшает числовое свойство на `delta`
     * @param delta на сколько уменьшить свойство
     */
    async decrease(delta: number) {
        const newValue = (await this.value()) - delta;
        await this.set(newValue);
    }
}
