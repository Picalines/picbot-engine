import { AllowedPropertyTypes, DatabasePropertyMap } from "../../../database/PropertyMap";

export class JsonDatabasePropertyMap extends DatabasePropertyMap {
    #map = new Map<string, AllowedPropertyTypes>();

    get keys(): IterableIterator<string> {
        return this.#map.keys();
    }

    getOrUndefined(key: string): AllowedPropertyTypes | undefined {
        return this.#map.get(key);
    }

    set(key: string, value: AllowedPropertyTypes): void {
        this.#map.set(key, value);
    }

    delete(key: string): boolean {
        return this.#map.delete(key);
    }

    has(key: string): boolean {
        return this.#map.has(key);
    }
}
