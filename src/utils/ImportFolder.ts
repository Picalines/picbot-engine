import { Dirent, readdirSync } from "fs";
import { join } from "path";
import { assert } from "./UsefulFunctions";
import { AnyConstructor } from "./UsefulTypes";

interface ExportItem<T> {
    readonly path: string;
    readonly item: T;
}

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

    const handleJsFile = async (file: Dirent): Promise<void> => {
        const localPath = join(folder, file.name);
        const globalPath = join(projectRoot, localPath);

        const moduleExports = await import(globalPath);

        const isClass = moduleExports instanceof constructor;
        assert(isClass || moduleExports.default instanceof constructor, `default export of type ${constructor.name} expected in module ${localPath}`);

        exports.push({ path: './' + localPath, item: isClass ? moduleExports : moduleExports.default });
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
