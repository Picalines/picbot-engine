import { Client, CommandInteraction } from "discord.js";
import { BotOptions, BotOptionsArgument, parseBotOptionsArgument } from "./Options.js";
import { ClientEventNames, NonDeprecatedClientEvents as ClientEvents, assert } from "../utils/index.js";
import { CommandContext, CommandStorage } from "../command/index.js";
import { Event, nodeEmitterEvents } from "../event/index.js";
import { Database } from "../database/index.js";
import { Logger } from "../logger/Logger.js";
import { StageSequence } from "../sequence/index.js";
import { Importer } from "../importer/index.js";

export class Bot {
    readonly options: BotOptions;

    readonly importer: Importer;
    readonly commands: CommandStorage;
    readonly database: Database;
    readonly logger: Logger;

    readonly events = Object.freeze({
        commandError: new Event<[interaction: CommandInteraction, error: Error]>(),
        commandExecuted: new Event<[context: CommandContext<any>]>(),
    });

    readonly clientEvents = <{ readonly [E in keyof ClientEvents]: Event<ClientEvents[E]> }>nodeEmitterEvents(this.client, ClientEventNames);

    readonly loadingSequence: StageSequence;
    readonly shutdownSequence: StageSequence;

    constructor(readonly client: Client, options: BotOptionsArgument) {
        this.options = parseBotOptionsArgument(options);

        this.logger = new Logger(this);

        this.importer = new Importer(this);

        this.loadingSequence = new StageSequence().useLogger(this.logger, {
            startedLog: () => 'loding bot...',
            finishedLog: () => `bot '${this.username}' successfully loaded`,
        });

        this.shutdownSequence = new StageSequence().useLogger(this.logger, {
            startedLog: () => `shutting down bot '${this.username}'...`,
            finishedLog: () => `bot '${this.username}' successfully shutted down`,
        });

        this.commands = new CommandStorage(this);

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
            task: () => this.importer.forEach('events', listener => {
                const event = listener.event(this);
                event.on((...args) => listener.listener(this, ...args));
            })
        });

        this.loadingSequence.add({
            name: 'initialize',
            task: () => this.importer.forEach('initializers', (initializer, path) => {
                this.logger.promiseTask(path, () => initializer.initialize(this));
            }),
        });

        this.loadingSequence.add({
            name: 'listen to interactions',
            task: () => void this.client.on('interactionCreate', interaction => {
                if (interaction.isCommand()) {
                    this.handleCommandInteraction(interaction);
                }
            })
        });

        this.loadingSequence.add({
            name: 'listen to SIGINT',
            task: () => void process.once('SIGINT', () => this.shutdown()
                .then(() => process.exit(0))
                .catch(() => process.exit(1))
            )
        });

        this.shutdownSequence.add({
            name: 'logout',
            task: () => this.client.destroy(),
        });

        this.shutdownSequence.add({
            name: 'deinitialize',
            task: () => this.importer.forEach('initializers', (initializer, path) => {
                if (initializer.deinitialize) {
                    this.logger.promiseTask(path, () => initializer.deinitialize!(this));
                }
            }),
        });
    }

    private async handleCommandInteraction(interaction: CommandInteraction): Promise<void> {
        assert(this.client.isReady(), 'client is not ready');
        assert(!interaction.user.bot, 'unexpected interaction from bot');

        if (this.client.application.id != interaction.applicationId) {
            return;
        }

        const commandName = interaction.commandName;

        const command = this.commands.get(commandName);
        assert(command, `command '${commandName}' not found`);

        const contextOrError = await command.execute(this, interaction);

        if (contextOrError instanceof Error) {
            return this.events.commandError.emit(interaction, contextOrError);
        }

        this.events.commandExecuted.emit(contextOrError);
    }

    load() {
        return this.loadingSequence.run();
    }

    shutdown() {
        return this.shutdownSequence.run();
    }

    get username(): string {
        return this.client.user?.username ?? 'bot';
    }
}
