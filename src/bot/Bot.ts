import { Client, ClientEvents } from "discord.js";
import { BotOptions, BotOptionsArgument, parseBotOptionsArgument } from "./Options";
import { ClientEventNames, GuildMessage, isGuildMessage, importFolder, StageSequenceBuilder } from "../utils";
import { CommandContext, CommandStorage } from "../command";
import { BotEventListener, createEventStorage, createNodeEmitterLink } from "../event";
import { Database } from "../database";
import { Logger } from "../logger/Logger";
import { Translator } from "../translator";

export class Bot {
    readonly options: BotOptions;

    readonly commands: CommandStorage;
    readonly database: Database;
    readonly translator: Translator;
    readonly logger: Logger;

    readonly clientEvents = createNodeEmitterLink<Client, { [E in keyof ClientEvents]: (...args: ClientEvents[E]) => void }>(this.client, ClientEventNames);
    readonly events;
    readonly #emit;

    readonly loadingSequence = new StageSequenceBuilder();
    readonly shutdownSequence = new StageSequenceBuilder();

    constructor(readonly client: Client, options: BotOptionsArgument) {
        const [events, emitEvent] = createEventStorage(this as Bot, {
            guildMemberMessage(message: GuildMessage) { },
            guildMyMessage(message: GuildMessage) { },

            commandNotFound(message: GuildMessage, wrongName: string) { },
            commandError(message: GuildMessage, error: Error) { },
            commandExecuted(context: CommandContext<unknown[]>) { },
        });

        this.events = events;
        this.#emit = emitEvent;

        this.options = parseBotOptionsArgument(options);

        this.logger = new Logger(this.options.loggerOptions);

        this.commands = new CommandStorage(this);

        this.translator = new Translator(this);

        this.database = new Database(this);

        this.loadingSequence.stage('require events', async () => {
            (await importFolder(BotEventListener, this.options.loadingPaths.events)).forEach(({ path, item: listener }) => {
                listener.connect(this);
                this.logger.log(path);
            });
        });

        this.loadingSequence.stage('login', () => new Promise((resolve, reject) => {
            this.client.once('ready', () => {
                this.logger.log('ready');
                resolve();
            });
            this.client.login(this.options.token).catch(reject).then(() => {
                this.logger.log(`logged in as ${this.username}`)
            });
        }));

        this.shutdownSequence.stage('logout', () => {
            this.client.destroy();
        });

        process.once('SIGINT', () => {
            this.shutdown()
                .then(() => process.exit(0))
                .catch(() => process.exit(1));
        });

        this.client.on('message', message => {
            if (isGuildMessage(message)) {
                this.handleGuildMessage(message);
            }
        });
    }

    get username(): string {
        return this.client.user?.username ?? 'bot';
    }

    private async handleGuildMessage(message: GuildMessage): Promise<void> {
        if (message.author.bot) {
            if (message.member.id == message.guild.me.id) {
                this.#emit('guildMyMessage', message);
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
            this.#emit('guildMemberMessage', message);
            return;
        }

        const commandName = lowerCaseContent.slice(prefixLength).replace(/\s.*$/, '');
        if (!commandName) {
            this.#emit('guildMemberMessage', message);
            return;
        }

        const command = this.commands.get(commandName);
        if (!command) {
            this.#emit('commandNotFound', message, commandName);
            return;
        }

        let context: CommandContext<unknown[]>;

        try {
            context = await command.execute(this, message);
        }
        catch (error: unknown) {
            this.#emit('commandError', message, error instanceof Error ? error : new Error(String(error)));
            return;
        }
        finally {
            message.channel.stopTyping(true);
        }

        this.#emit('commandExecuted', context);
        return;
    }

    load() {
        return this.executeStages(this.loadingSequence, 'loading', 'loaded');
    }

    shutdown() {
        return this.executeStages(this.shutdownSequence, 'shutting down', 'shutted down');
    }

    private async executeStages(stagesBuilder: StageSequenceBuilder, gerund: string, doneState: string) {
        this.logger.task(`${gerund} bot...`);

        const stages = stagesBuilder.build();

        for (const { name, task } of stages) {
            this.logger.task(name);

            try {
                await task();
            }
            catch (error) {
                this.logger.done('error', error instanceof Error ? error.message : String(error));
                throw error;
            }

            this.logger.done('success', '');
        }

        this.logger.done('success', `bot '${this.username}' successfully ${doneState}`);
    }
}
