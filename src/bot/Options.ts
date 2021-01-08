import { Guild } from "discord.js";
import { assert, deepMerge, DeepPartialExcept, Overwrite, PromiseOrSync } from "../utils/index.js";
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
}>;

export type BotOptionsArgument = Overwrite<DeepPartialExcept<BotOptions, 'token'>, Partial<{
    /**
     * @example (() => ['!']) | ['!'] | prefixesDbState
     */
    fetchPrefixes: ArgumentFetcher<string[]>;
    /**
     * @example (() => 'en-US') | 'en-US' | localeDbState
     */
    fetchLocale: ArgumentFetcher<string>;
}>>;

export const DefaultBotOptions: BotOptions = {
    token: '',
    tokenType: 'string',
    loadingPaths: {
        commands: 'src/commands',
        events: 'src/events',
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
};

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

    return fetcher as Fetcher<T>;
}
