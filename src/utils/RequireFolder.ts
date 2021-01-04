import { Dirent, readdirSync } from "fs";
import { join } from "path";
import { assert } from "./UsefulFunctions";
import { AnyConstructor } from "./UsefulTypes";

type ExportItem<T> = [path: string, item: T];

/**
 * Рекурсивно импортирует все js файлы в папке (поддерживает только export default)
 * @param constructor класс
 * @param folder путь до папки
 */
export function requireFolder<T>(constructor: AnyConstructor<T>, folder: string): ExportItem<T>[] {
    let dir: Dirent[];

    try {
        dir = readdirSync(folder, { withFileTypes: true });
    }
    catch (error) {
        if (error?.code === 'ENOENT') {
            return [];
        }
        throw error;
    }

    const jsFiles = dir.filter(d => d.isFile() && d.name.endsWith('.js')).map(d => d.name);
    const subFolders = dir.filter(d => d.isDirectory()).map(d => d.name);

    const _require = require.main?.require ?? require;

    const exports = jsFiles.map<ExportItem<T>>(file => {
        const path = join('.', folder, file);
        const moduleExports = _require('./' + path);

        const isClass = moduleExports instanceof constructor;
        assert(isClass || moduleExports.default instanceof constructor, `default export of type ${constructor.name} expected in module ${path}`);

        return [path, isClass ? moduleExports : moduleExports.default];
    });

    for (const subFolder of subFolders) {
        exports.push(...requireFolder(constructor, join(folder, subFolder)));
    }

    return exports;
}
