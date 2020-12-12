import { Client, ClientEvents } from "discord.js";
import { BotOptions, BotOptionsArgument, DefaultBotOptions } from "./Options";
import { ClientEventNames, deepMerge, GuildMessage, isGuildMessage, requireFolder, StageSequenceBuilder } from "../utils";
import { AnyCommand, Command, CommandContext, CommandStorage, helpCommand } from "../command";
import { BotEventListener, createEventStorage, EmitOf, createNodeEmitterLink } from "../event";
import { BotDatabase, Property } from "../database";
import { Logger } from "../logger/Logger";

/**
 * Класс бота
 */
export class Bot {
    /**
     * Настройки бота
     */
    readonly options: BotOptions;

    /**
     * Хранилище команд бота
     */
    readonly commands: CommandStorage;

    /**
     * База данных бота
     */
    readonly database: BotDatabase;

    /**
     * Логгер
     */
    readonly logger: Logger;

    /**
     * События клиента API
     */
    readonly clientEvents = createNodeEmitterLink<Client, { [E in keyof ClientEvents]: (...args: [...ClientEvents[E]]) => void }>(this.client, ClientEventNames);

    /**
     * События бота
     */
    readonly events;

    /**
     * Приватная функция вызова событий
     */
    readonly #emit: EmitOf<Bot['events']>;

    /**
     * Стадии загрузки бота
     */
    readonly loadingSequence = new StageSequenceBuilder();

    /**
     * Стадии выключения бота
     */
    readonly shutdownSequence = new StageSequenceBuilder();

    /**
     * @param client Клиент API discord.js
     * @param options настройки бота
     */
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

        this.options = this.parseOptionsArgument(options);

        this.logger = new Logger(this.options.loggerOptions);

        this.commands = new CommandStorage();

        if (this.options.useBuiltInHelpCommand) {
            this.commands.add(helpCommand as unknown as AnyCommand);
        }

        this.database = new BotDatabase(this, this.options.database.handler);

        this.loadingSequence.stage('login', () => new Promise((resolve, reject) => {
            this.client.once('ready', () => {
                this.logger.log('ready');
                resolve();
            });
            this.client.login(this.options.token).catch(reject).then(() => {
                this.logger.log(`logged in as ${this.username}`)
            });
        }));

        this.loadingSequence.stage('require commands', () => {
            requireFolder<AnyCommand>(Command, this.options.loadingPaths.commands).forEach(([path, command]) => {
                this.commands.add(command)
                this.logger.log(path);
            });
        });

        this.loadingSequence.stage('require events', () => {
            requireFolder(BotEventListener, this.options.loadingPaths.events).forEach(([path, listener]) => {
                listener.connect(this);
                this.logger.log(path);
            });
        });

        this.client.on('message', message => {
            if (isGuildMessage(message)) {
                this.handleGuildMessage(message);
            }
        });

        this.shutdownSequence.stage('logout', () => {
            this.client.destroy();
        });

        process.once('SIGINT', () => {
            this.shutdown()
                .then(() => process.exit(0))
                .catch(() => process.exit(1));
        });
    }

    /**
     * @returns юзернейм бота. Если [[Client.user]] равно `undefined`, вернёт `bot`
     */
    get username(): string {
        return this.client.user?.username ?? 'bot';
    }

    /**
     * Обрабатывает команду в сообщении, если оно начинается с префикса команд
     * @param message сообщение пользователя
     */
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

    /**
     * Загружает бота
     */
    async load() {
        await this.executeStages(this.loadingSequence, 'loading', 'loaded');
    }

    /**
     * Выключает бота
     */
    async shutdown() {
        await this.executeStages(this.shutdownSequence, 'shutting down', 'shutted down');
    }

    /**
     * Выполняет стадии из StageSequenceBuilder
     * @ignore
     */
    private async executeStages(stagesBuilder: StageSequenceBuilder, gerund: string, doneState: string) {
        this.logger.task(`${gerund} bot...`);

        const stages = stagesBuilder.build();

        for (const { name, task } of stages) {
            this.logger.task(name);

            try {
                await task();
            }
            catch (error) {
                this.logger.endTask('error', error instanceof Error ? error.message : String(error));
                throw error;
            }

            this.logger.endTask('success', '');
        }

        this.logger.endTask('success', `bot '${this.username}' successfully ${doneState}`);
    }

    /**
     * Выносит логику превращения настроек бота
     * @param options аргумент настроек
     */
    private parseOptionsArgument(options: BotOptionsArgument): BotOptions {
        let { fetchPrefixes } = options;

        if (fetchPrefixes instanceof Array) {
            const prefixes = fetchPrefixes as string[];

            fetchPrefixes = () => prefixes;
        }
        else if (fetchPrefixes instanceof Property) {
            const prefixes = fetchPrefixes;

            fetchPrefixes = (bot, guild) => bot.database.accessProperty(guild, prefixes).value();
        }

        return deepMerge(DefaultBotOptions, {
            ...options as any,
            fetchPrefixes,
        });
    }
}
