import { Guild } from "discord.js";
import { assert, DeepPartialExcept, Overwrite, PromiseOrSync } from "../utils/index.js";
import { State, CreateDatabaseHandler, createJsonDatabaseHandler } from "../database/index.js";
import { LoggerOptions, pipeLoggerTheme } from "../logger/index.js";
import { Bot } from "./Bot.js";
import { readFileSync } from "fs";

export type BotOptions = Readonly<{
    token: string;

    /**
     * - 'string' does nothing
     * - 'file' reads file (path is options.token)
     * - 'env' gets key from process.env (key is options.token)
     * @default 'string'
     */
    tokenType: 'string' | 'file' | 'env';

    loadingPaths: Readonly<{
        /** @default 'src/states' */
        states: string;

        /** @default 'src/selectors' */
        selectors: string;

        /** @default 'src/events' */
        events: string;

        /** @default 'src/initializers' */
        initializers: string,

        /** @default 'src/commands' */
        commands: string;

        /** @default 'src/translations' */
        translations: string;
    }>;

    /**
     * @default false
     */
    canBotsRunCommands: boolean;

    /**
     * @default () => ['!']
     */
    fetchPrefixes: Fetcher<string[]>;

    /**
     * @default () => 'en-US'
     */
    fetchLocale: Fetcher<string>;

    /**
     * @default true
     */
    useBuiltInHelpCommand: boolean;

    loggerOptions: Partial<LoggerOptions>;

    /**
     * @default createJsonDatabaseHandler({ databasePath: '/database/' })
     */
    databaseHandler: CreateDatabaseHandler;

    /**
     * @default true
     */
    cleanupMemberOnRemove: boolean;

    /**
     * @default true
     */
    cleanupGuildOnDelete: boolean;
}>;

export type BotOptionsArgument = Overwrite<DeepPartialExcept<BotOptions, 'token'>, {
    /**
     * @example (() => ['!']) | ['!'] | prefixesDbState
     */
    fetchPrefixes?: ArgumentFetcher<string[]>;
    /**
     * @example (() => 'en-US') | 'en-US' | localeDbState
     */
    fetchLocale?: ArgumentFetcher<string>;
}>;

export const DefaultBotOptions: BotOptions = deepFreeze({
    token: '',
    tokenType: 'string',
    loadingPaths: {
        commands: 'src/commands',
        events: 'src/events',
        initializers: 'src/initializers',
        states: 'src/states',
        selectors: 'src/selectors',
        translations: 'src/translations',
    },
    canBotsRunCommands: false,
    fetchPrefixes: () => ['!'],
    fetchLocale: () => 'en-US',
    useBuiltInHelpCommand: true,
    loggerOptions: {
        hide: false,
        theme: pipeLoggerTheme,
    },
    databaseHandler: createJsonDatabaseHandler({ databasePath: '/database/' }),
    cleanupMemberOnRemove: true,
    cleanupGuildOnDelete: true,
});

type Fetcher<T> = (bot: Bot, guild: Guild) => PromiseOrSync<T>;

type ArgumentFetcher<T> = T | State<'guild', T> | Fetcher<T>;

export function parseBotOptionsArgument(options: BotOptionsArgument): BotOptions {
    let { fetchPrefixes, fetchLocale, token } = options;

    fetchPrefixes = parseFetcher(fetchPrefixes, <(f: any) => f is string[]>(f => f instanceof Array));
    fetchLocale = parseFetcher(fetchLocale, <(f: any) => f is string>(f => typeof f === 'string'));

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

    return deepMerge(DefaultBotOptions, {
        ...options as any,
        fetchPrefixes,
        fetchLocale,
        token,
    });
}

function parseFetcher<T>(fetcher: ArgumentFetcher<T> | undefined, isValue: (fetcher: ArgumentFetcher<T> | undefined) => fetcher is T): Fetcher<T> | undefined {
    if (!fetcher) {
        return undefined;
    }

    if (isValue(fetcher)) {
        const value = fetcher;
        fetcher = () => value;
    }
    else if (fetcher instanceof State) {
        const state = fetcher;
        fetcher = (bot, guild) => bot.database.accessState(guild, state).value();
    }

    return fetcher;
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
