import { PropertyAccess } from "../../database/property/Access";
import { NonEmptyReadonly } from "../../utils";

export const validatePrefix = (prefix: string) => prefix.length > 0 && !prefix.includes(' ');

export class PrefixesPropertyAccess extends PropertyAccess<NonEmptyReadonly<string[]>> {
    /**
     * Добавляет префикс
     * @param prefix новый префикс
     * @returns true, если этого префикса раньше не было
     */
    async add(prefix: string): Promise<boolean> {
        prefix = prefix.toLowerCase();

        const oldPrefixes = await this.value();

        if (!validatePrefix(prefix) || oldPrefixes.includes(prefix)) {
            return false;
        }

        const newPrefixes: NonEmptyReadonly<string[]> = [...oldPrefixes, prefix] as any;

        await this.set(newPrefixes);

        return true;
    }

    /**
     * Удаляет префикс из хранилища (если он не единственный)
     * @param prefix префикс, который нужно удалить
     * @returns true, если префикс был удалён
     */
    async remove(prefix: string): Promise<boolean> {
        prefix = prefix.toLowerCase();

        const oldPrefixes = [...await this.value()];
        if (oldPrefixes.length <= 1) {
            return false;
        }

        const removedIndex = oldPrefixes.indexOf(prefix);
        if (removedIndex < 0) {
            return false;
        }

        oldPrefixes.splice(removedIndex);

        await this.set(oldPrefixes as any);
        return true;
    }

    /**
     * @param prefix префикс для проверки
     * @returns true, если префикс есть в хранилище
     */
    async has(prefix: string): Promise<boolean> {
        const prefixes = await this.value();
        return prefixes.includes(prefix.toLowerCase());
    }
}
