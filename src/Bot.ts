import { Client } from "discord.js";
import { EventEmitter } from "events";
import { promises } from "fs";
import { BotOptions, BotOptionsArgument, DefaultBotOptions } from "./BotOptions";
import { CommandStorage } from "./command/Storage";
import { BotDatabase } from "./database/BotDatabase";
import { deepMerge, GuildMessage, isGuildMessage, TypedEventEmitter } from "./utils";
import * as BuiltInCommands from "./builtIn/command";
import { AnyCommand } from "./command/Command";
import { Logger } from "./Logger";
import { CommandContext } from "./command/Context";
import { AnyProperty, Property } from "./database/property/Property";

interface BotEvents {
    guildMemberMessage(message: GuildMessage): void;
    guildMyMessage(message: GuildMessage): void;

    commandNotFound(message: GuildMessage, wrongName: string): void;
    commandError(message: GuildMessage, error: Error): void;
    commandExecuted<Args extends unknown[]>(context: CommandContext<Args>): void;
}

/**
 * Класс бота
 */
export class Bot extends (EventEmitter as new () => TypedEventEmitter<BotEvents>) {
    /**
     * Настройки бота
     */
    public readonly options: BotOptions;

    /**
     * Хранилище команд бота
     */
    public readonly commands: CommandStorage;

    /**
     * База данных бота
     */
    public readonly database: BotDatabase;

    /**
     * Логгер
     */
    public readonly logger: Logger;

    /**
     * @param client Клиент API discord.js
     * @param options настройки бота
     */
    constructor(readonly client: Client, options: BotOptionsArgument = {}) {
        super();

        this.options = this.parseOptionsArgument(options);

        this.logger = new Logger(this.options.loggerOptions);

        this.client.on('ready', () => {
            this.logger.endTask('success', 'logged in as ' + this.username);
        });

        this.commands = new CommandStorage(this);

        const builtInCommandsSetting = this.options.commands.builtIn as Record<string, boolean>;
        for (const builtInCommand of Object.values(BuiltInCommands)) {
            if (builtInCommandsSetting[builtInCommand.name]) {
                this.commands.add(builtInCommand as unknown as AnyCommand);
            }
        }

        this.database = new BotDatabase(this, this.options.database.handler);

        process.once('SIGINT', async () => {
            if (this.options.destroyClientOnSigint) {
                this.client.destroy();
            }

            if (this.options.database.saveOnSigint) {
                await this.database.save();
            }

            process.exit(0);
        });

        for (const property of this.options.database.properties) {
            this.database.properties.add(property);
        }

        this.commands.on('added', command => {
            command.requiredProperties?.forEach(property => {
                this.database.properties.add(property);
            });
        });

        this.client.once('ready', () => {
            this.database.load();
        });

        this.client.on('message', message => {
            if (isGuildMessage(message)) {
                this.handleGuildMessage(message);
            }
        });
    }

    /**
     * @returns юзернейм бота. Если [[Client.user]] равно `undefined`, вернёт `bot`
     */
    public get username(): string {
        return this.client.user?.username ?? 'bot';
    }

    /**
     * Обрабатывает команду в сообщении, если оно начинается с префикса команд
     * @param message сообщение пользователя
     */
    private async handleGuildMessage(message: GuildMessage): Promise<void> {
        if (message.author.bot) {
            if (message.member.id == message.guild.me.id) {
                this.emit('guildMyMessage', message);
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
            this.emit('guildMemberMessage', message);
            return;
        }

        const commandName = lowerCaseContent.slice(prefixLength).replace(/\s.*$/, '');
        if (!commandName) {
            this.emit('guildMemberMessage', message);
            return;
        }

        const command = this.commands.get(commandName);
        if (!command) {
            this.emit('commandNotFound', message, commandName);
            return;
        }

        let context: CommandContext<unknown[]>;

        try {
            context = await command.execute(this, message);
        }
        catch (error: unknown) {
            this.emit('commandError', message, error instanceof Error ? error : new Error(String(error)));
            return;
        }
        finally {
            message.channel.stopTyping(true);
        }

        this.emit('commandExecuted', context);
        return;
    }

    /**
     * Аналог функции client.login c поддержкой чтения файла и переменных окружения
     * @param token токен discord api
     * @param tokenType тип токена. `file` прочитает файл с токеном. `env` подставит значение из `process.env`
     */
    public async login(token: string, tokenType: 'string' | 'file' | 'env' = 'string') {
        this.logger.task('logging in Discord...');

        if (tokenType == 'env') {
            if (process.env[token] === undefined) {
                throw new Error(`env variable '${token}' not found`);
            }
            token = process.env[token]!;
        }
        else if (tokenType == 'file') {
            token = (await promises.readFile(token)).toString();
        }

        try {
            await this.client.login(token);
        }
        catch (error: unknown) {
            this.logger.endTask('error', `could not log in: ${error instanceof Error ? error.message : String(error)}`);
        }
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

            if (!options.database) {
                options.database = {};
            }
            if (options.database.properties) {
                (options.database.properties as AnyProperty[]).push(prefixes)
            }
            else {
                options.database.properties = [prefixes];
            }
        }

        return deepMerge(DefaultBotOptions, {
            ...options as any,
            fetchPrefixes,
        });
    }
}
