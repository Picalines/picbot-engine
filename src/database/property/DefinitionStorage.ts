import { EntityType } from "../Entity";
import { AnyProperty } from "./Property";

/**
 * Хранилище свойств сущностей в базе данных
 */
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
     * @returns true, если в хранилище есть свойство с ключом key
     * @param key ключ свойства
     */
    has(key: string): boolean {
        return this.#properties.has(key);
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
    list<E extends EntityType>(entityType: E | 'any'): AnyProperty<E>[] {
        const props = [...this.#properties.values()];
        if (entityType == 'any') {
            return props as any;
        }
        return props.filter(p => p.entityType == entityType) as AnyProperty<E>[];
    }
}
