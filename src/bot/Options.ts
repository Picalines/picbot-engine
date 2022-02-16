import { assert, DeepPartial, Overwrite } from "../utils/index.js";
import { CreateDatabaseHandler, createJsonDatabaseHandler } from "../database/index.js";
import { LoggerTheme, pipeLoggerTheme } from "../logger/index.js";
import { readFileSync } from "fs";
import { ImporterOptions } from "../importer/index.js";

export type BotOptions = Readonly<{
    token: string;

    /**
     * - 'string' does nothing
     * - 'file' reads file (path is options.token)
     * - 'env' gets key from process.env (key is options.token)
     * @default 'string'
     */
    tokenType: 'string' | 'file' | 'env';

    importerOptions: ImporterOptions;

    /**
     * @default pipeLoggerTheme
     */
    loggerTheme: LoggerTheme;

    /**
     * @default createJsonDatabaseHandler({ databasePath: '/database/' })
     */
    databaseHandler: CreateDatabaseHandler;
}>;

export type BotOptionsArgument = Overwrite<DeepPartial<BotOptions>, Readonly<{
    token: string;
}>>;

export const DefaultBotOptions: BotOptions = deepFreeze<BotOptions>({
    token: '',
    tokenType: 'string',
    importerOptions: {
        baseDir: 'src',
        importDirs: {
            commands: 'commands',
            events: 'events',
            initializers: 'initializers',
            states: 'states',
            selectors: 'selectors',
        },
    },
    loggerTheme: pipeLoggerTheme,
    databaseHandler: createJsonDatabaseHandler({ databasePath: '/database/' }),
});

export function parseBotOptionsArgument(options: BotOptionsArgument): BotOptions {
    let { token } = options;

    const { tokenType = 'string' } = options;

    switch (tokenType) {
        default:
            throw new Error(`unsupported token type '${tokenType}'`);

        case 'string':
            break;

        case 'env':
            assert(token in process.env, 'token environment variable not found');
            token = process.env[token]!;
            break;

        case 'file':
            token = readFileSync(token).toString();
            break;
    }

    return deepMerge(DefaultBotOptions, { ...options as any, token });
}

function isPlainObject(obj: any): boolean {
    return typeof obj === 'object' && obj !== null
        && obj.constructor === Object
        && Object.prototype.toString.call(obj) === '[object Object]';
}

function deepMerge<T>(origin: T, override: Partial<T>): T {
    const copy: T = {} as any;

    for (const key in origin) {
        if (override[key] === undefined) {
            copy[key] = origin[key];
            continue;
        }
        if (isPlainObject(origin[key]) && isPlainObject(override[key])) {
            copy[key] = deepMerge(origin[key], override[key]!);
        }
        else {
            copy[key] = override[key]!;
        }
    }

    return copy;
}

function deepFreeze<T>(obj: T): Readonly<T> {
    Object.freeze(obj);
    if (obj == undefined) {
        return obj;
    }

    Object.getOwnPropertyNames(obj).forEach(<(value: string) => void>((key: keyof T) => {
        if (obj[key] != undefined
            && (typeof obj[key] == "object" || typeof obj[key] == "function")
            && !Object.isFrozen(obj[key])) {
            deepFreeze(obj[key]);
        }
    }));

    return obj;
}
