import { Client, ClientEvents } from "discord.js";
import { BotOptions, BotOptionsArgument, parseBotOptionsArgument } from "./Options.js";
import { GuildMessage, isGuildMessage, importFolder, ClientEventNames } from "../utils/index.js";
import { CommandContext, CommandStorage } from "../command/index.js";
import { Event, nodeEmitterEvents } from "../event/index.js";
import { Database } from "../database/index.js";
import { Logger } from "../logger/Logger.js";
import { Translator } from "../translator/index.js";
import { StageSequence } from "../sequence/index.js";
import { BotInitializer } from "./Initializer.js";
import { BotEventListener } from "./EventListener.js";

export class Bot {
    readonly options: BotOptions;

    readonly commands: CommandStorage;
    readonly database: Database;
    readonly translator: Translator;
    readonly logger: Logger;

    readonly events = Object.freeze({
        guildMemberMessage: new Event<[message: GuildMessage]>(),
        guildMyMessage: new Event<[message: GuildMessage]>(),

        commandNotFound: new Event<[message: GuildMessage, wrongName: string]>(),
        commandError: new Event<[message: GuildMessage, error: Error]>(),
        commandExecuted: new Event<[context: CommandContext<unknown[]>]>(),
    });

    readonly clientEvents = <{ readonly [E in keyof ClientEvents]: Event<ClientEvents[E]> }>nodeEmitterEvents(this.client, ClientEventNames);

    readonly loadingSequence: StageSequence;
    readonly shutdownSequence: StageSequence;

    constructor(readonly client: Client, options: BotOptionsArgument) {
        this.options = parseBotOptionsArgument(options);

        this.logger = new Logger(this.options.loggerOptions);

        this.loadingSequence = new StageSequence().useLogger(this.logger, {
            startedLog: () => 'loding bot...',
            finishedLog: () => `bot '${this.username}' successfully loaded`,
        });

        this.shutdownSequence = new StageSequence().useLogger(this.logger, {
            startedLog: () => `shutting down bot '${this.username}'...`,
            finishedLog: () => `bot '${this.username}' successfully shutted down`,
        });

        this.commands = new CommandStorage(this);

        this.translator = new Translator(this);

        this.database = new Database(this);

        this.loadingSequence.add({
            name: 'login',
            task: () => new Promise((resolve, reject) => {
                this.client.once('ready', () => {
                    this.logger.log('ready');
                    resolve();
                });
                this.client.login(this.options.token)
                    .then(() => this.logger.log(`logged in as ${this.username}`))
                    .catch(reject);
            }),
        });

        this.loadingSequence.add({
            name: 'import events',
            task: async () => {
                (await importFolder(BotEventListener, this.options.loadingPaths.events)).forEach(({ item: listener, path }) => {
                    const event = listener.event(this);
                    event.on((...args) => listener.listener(this, ...args));
                    this.logger.log(path);
                });
            },
        });

        let initializers: { item: BotInitializer, path: string }[];

        this.loadingSequence.add({
            name: 'initialize',
            task: async () => {
                initializers = await importFolder(BotInitializer, this.options.loadingPaths.initializers);
                for (const { item: initializer, path } of initializers) {
                    this.logger.promiseTask(path, async () => await initializer.initialize(this));
                }
            },
        });

        this.shutdownSequence.add({
            name: 'logout',
            task: () => this.client.destroy(),
        });

        this.shutdownSequence.add({
            name: 'deinitialize',
            task: async () => {
                for (const { item: initializer, path } of initializers) {
                    if (initializer.deinitialize) {
                        this.logger.promiseTask(path, async () => await initializer.deinitialize!(this));
                    }
                }
            }
        });

        process.once('SIGINT', () => {
            this.shutdown()
                .then(() => process.exit(0))
                .catch(() => process.exit(1));
        });

        this.loadingSequence.add({
            name: 'listen to messages',
            runsAfter: 'initialize',
            task: () => void this.client.on('message', message => {
                if (isGuildMessage(message)) {
                    this.handleGuildMessage(message);
                }
            })
        });
    }

    get username(): string {
        return this.client.user?.username ?? 'bot';
    }

    private async handleGuildMessage(message: GuildMessage): Promise<void> {
        if (message.author.bot) {
            if (message.member.id == message.guild.me.id) {
                this.events.guildMyMessage.emit(message);
                return;
            }
            if (!this.options.canBotsRunCommands) {
                return;
            }
        }

        const guildPrefixes = await this.options.fetchPrefixes(this, message.guild);
        if (!guildPrefixes.length) {
            this.logger.warning(`empty guild prefixes array ('${message.guild.name}', ${message.guild.id})`);
            return;
        }

        const lowerCaseContent = message.content.toLowerCase();

        const prefixLength = guildPrefixes.find(p => lowerCaseContent.startsWith(p))?.length ?? 0;
        if (prefixLength <= 0) {
            this.events.guildMemberMessage.emit(message);
            return;
        }

        const commandName = lowerCaseContent.slice(prefixLength).replace(/\s.*$/, '');
        if (!commandName) {
            this.events.guildMemberMessage.emit(message);
            return;
        }

        const command = this.commands.get(commandName);
        if (!command) {
            this.events.commandNotFound.emit(message, commandName);
            return;
        }

        const [context, error] = await command.execute(this, message);

        message.channel.stopTyping(true);

        if (error) {
            this.events.commandError.emit(message, error);
            return;
        }

        this.events.commandExecuted.emit(context);
        return;
    }

    load() {
        return this.loadingSequence.run();
    }

    shutdown() {
        return this.shutdownSequence.run();
    }
}
