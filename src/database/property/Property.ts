import { PropertyAccess, PropertyAccessConstructor } from "./Access";
import { EntityType } from "../Entity";
import { assert } from "../../utils";

interface PropertyDefinition<E extends EntityType, T, A extends PropertyAccess<T>> {
    readonly key: string;
    readonly entityType: E;
    readonly defaultValue: T;
    validate(value: T): boolean;
    readonly accessorClass?: PropertyAccessConstructor<T, A>;
}

export interface Property<E extends EntityType, T, A extends PropertyAccess<T> = PropertyAccess<T>> extends PropertyDefinition<E, T, A> { }

export class Property<E extends EntityType, T, A extends PropertyAccess<T> = PropertyAccess<T>> {
    constructor(definition: PropertyDefinition<E, T, A>) {
        Object.assign(this, definition);

        assert(this.key && !this.key.includes(' '), `property key '${this.key}' is invalid (empty or includes spaces)`);
        assert(this.validate(this.defaultValue), `default value of property '${this.key}' is invalid (validate returned false)`);
    }
}

export type AnyProperty<E extends EntityType = EntityType> = Property<E, any>;
