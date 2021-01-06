import { Property } from "./Property";
import { EntityType } from "../Entity";

interface AccessMethods<T> {
    set(value: T): Promise<void>;
    reset(): Promise<boolean>;
    rawValue(): Promise<T | undefined>;
    value(): Promise<T>;
}

export interface PropertyAccess<T> extends AccessMethods<T> { }

export class PropertyAccess<T> {
    constructor(
        readonly property: Property<EntityType, T>,
        methods: AccessMethods<T>
    ) {
        Object.assign(this, methods);
    }
}

export interface PropertyAccessConstructor<T, A extends PropertyAccess<T> = PropertyAccess<T>> {
    new(property: Property<EntityType, T>, methods: AccessMethods<T>): A;
}
