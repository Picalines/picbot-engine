import { existsSync, promises as fs } from "fs";
import { join } from "path";
import { assert } from "../utils/index.js";
import { Bot } from "../bot/Bot.js";
import { BotEventListener, BotInitializer } from "../bot/index.js";
import { Command } from "../command/index.js";
import { Selector, State } from "../database/index.js";
import { TranslationCollection } from "../translator/index.js";

export type ImportDir = keyof typeof Importer['importDirClasses'];

export type ImportDirClass<K extends ImportDir> = typeof Importer['importDirClasses'][K]

export type ImporterOptions = Readonly<{
    /** @default 'src' */
    baseDir: string;

    importDirs: { readonly [K in ImportDir]: string };
}>;

export class Importer {
    static readonly importDirClasses = Object.freeze({
        commands: Command,
        events: BotEventListener,
        initializers: BotInitializer,
        selectors: Selector,
        states: State,
        translations: TranslationCollection,
    });

    readonly #cache: { [K in ImportDir]?: (readonly [InstanceType<ImportDirClass<K>>, string])[] } = {};

    constructor(readonly bot: Bot) {
        const { baseDir } = this.bot.options.importerOptions;
        assert(existsSync(baseDir), `base importer dir '${baseDir}' not found`);
    }

    async *generator<K extends ImportDir>(dir: K): AsyncGenerator<readonly [item: InstanceType<ImportDirClass<K>>, path: string]> {
        let cached = this.#cache[dir];
        if (cached !== undefined) {
            yield* cached as any;
            return;
        }

        const { baseDir, importDirs } = this.bot.options.importerOptions;

        assert(dir in importDirs, `unknown importer dir '${dir}'`);

        const projectDir = join(baseDir, importDirs[dir]);
        if (!existsSync(projectDir)) {
            return;
        }

        const constructor = Importer.importDirClasses[dir];
        const projectRoot = process.argv[1]!;
        const isJsFile = RegExp.prototype.test.bind(/.*\.(m|c)?js$/);

        this.bot.logger.task(`${projectDir} -> ${constructor.name}`);
        cached = [];

        for await (const localPath of readdirRecursive(projectDir)) {
            if (!isJsFile(localPath)) {
                continue;
            }

            const { default: defaultExport } = await import(join('file://', projectRoot, projectDir, localPath));
            assert(defaultExport instanceof constructor, `default export of type ${constructor.name} expected in module ${localPath}`);

            const exportItem = [defaultExport as any, localPath] as const;

            this.bot.logger.log(localPath);

            cached.push(exportItem);
            yield exportItem;
        }

        this.#cache[dir] = cached;
        this.bot.logger.done('success', '');
    }

    async import<K extends ImportDir>(dir: K) {
        if (!(dir in this.#cache)) {
            for await (const _ of this.generator(dir)) { }
        }
    }

    async forEach<K extends ImportDir>(dir: K, callback: (item: InstanceType<ImportDirClass<K>>, path: string) => any) {
        for await (const [item, path] of this.generator(dir)) {
            await callback(item, path);
        }
    }

    async isImported<K extends ImportDir>(dir: K, instance: InstanceType<ImportDirClass<K>>): Promise<boolean> {
        //@ts-ignore
        return (this.#cache[dir]?.find(item => item[0] == instance) != undefined) ?? false;
    }
}

async function* readdirRecursive(path: string): AsyncGenerator<string> {
    for (const dirent of await fs.readdir(path, { withFileTypes: true })) {
        if (dirent.isFile()) {
            yield dirent.name;
        }
        else if (dirent.isDirectory()) {
            for await (const subPath of readdirRecursive(join(path, dirent.name))) {
                yield join(dirent.name, subPath);
            }
        }
    }
}
