import { Entity } from "../Entity";
import { AnyProperty } from "./Definition";

export class PropertyDefinitionStorage {
    #properties = new Map<string, AnyProperty>();

    /**
     * Добавляет свойство сущности в память базы данных
     * @param property свойство сущности
     * @returns true, если свойства не было в памяти
     */
    add(property: AnyProperty): boolean {
        if (this.#properties.has(property.key)) {
            return false;
        }

        this.#properties.set(property.key, property);
        return true;
    }

    /**
     * @returns свойство из хранилища по его ключу
     * @param key ключ свойства
     */
    get(key: string): AnyProperty | undefined {
        return this.#properties.get(key);
    }

    /**
     * @returns список свойств сущностей с определённым типом
     * @param entityType 
     */
    list<E extends Entity>(entityType: E | 'any'): AnyProperty<E>[] {
        const props = [...this.#properties.values()];
        if (entityType == 'any') {
            return props as any;
        }
        return props.filter(p => p.entityType == entityType) as AnyProperty<E>[];
    }
}
