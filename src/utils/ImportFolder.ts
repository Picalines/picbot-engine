import { Dirent, readdirSync } from "fs";
import { join } from "path";
import { assert } from "./UsefulFunctions.js";

interface ExportItem<T> {
    readonly path: string;
    readonly item: T;
}

type AnyConstructor<T> = new (...args: any[]) => T;

export async function importFolder<T>(constructor: AnyConstructor<T>, folder: string): Promise<ExportItem<T>[]> {
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

    const exports: ExportItem<T>[] = [];

    const projectRoot = process.argv[1];

    const globalPathPrefix = isESM() ? 'file://' : '';

    const handleJsFile = async (file: Dirent): Promise<void> => {
        const localPath = join(folder, file.name);
        const globalPath = globalPathPrefix + join(projectRoot, localPath);

        const { default: defaultExport } = await import(globalPath);

        assert(defaultExport instanceof constructor, `default export of type ${constructor.name} expected in module ${localPath}`);

        exports.push({ path: './' + localPath, item: defaultExport });
    }

    const handleSubFolder = async (subFolder: Dirent): Promise<void> => {
        exports.push(...await importFolder(constructor, join(folder, subFolder.name)));
    }

    const jsFileRegex = /.*\.(m|c)?js$/;
    const promises: Promise<void>[] = [];

    for (const dirent of dir) {
        if (dirent.isDirectory()) {
            promises.push(handleSubFolder(dirent));
        }
        else if (dirent.isFile() && jsFileRegex.test(dirent.name)) {
            promises.push(handleJsFile(dirent));
        }
    }

    await Promise.all(promises);

    return exports;
}

function isESM() {
    try {
        __dirname
        __filename
    }
    catch {
        return true;
    }
    return false;
}
