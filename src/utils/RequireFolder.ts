import { readdirSync } from "fs";
import { join } from "path";
import { AnyConstructor } from "./UsefulTypes";

type ExportItem<T> = [path: string, item: T];

/**
 * Рекурсивно импортирует все js файлы в папке (поддерживает только export default)
 * @param constructor класс
 * @param folder путь до папки
 */
export function requireFolder<T>(constructor: AnyConstructor<T>, folder: string): ExportItem<T>[] {
    const dir = readdirSync(folder, { withFileTypes: true });

    const jsFiles = dir.filter(d => d.isFile() && d.name.endsWith('.js')).map(d => d.name);
    const subFolders = dir.filter(d => d.isDirectory()).map(d => d.name);

    const _require = require.main?.require ?? require;

    const exports = jsFiles.map<ExportItem<T>>(file => {
        const path = join('.', folder, file);
        const item = _require('./' + path);

        if (!(item instanceof constructor)) {
            throw new Error(`default export of type ${constructor.name} expected in module ${path}`);
        }

        return [path, item];
    });

    for (const subFolder of subFolders) {
        exports.push(...requireFolder(constructor, join(folder, subFolder)));
    }

    return exports;
}
