import { Client } from "discord.js";
import { EventEmitter } from "events";
import { promises } from "fs";
import { BotOptions, BotOptionsArgument, DefaultBotOptions } from "./BotOptions";
import { CommandStorage } from "./command/Storage";
import { BotDatabase } from "./database/BotDatabase";
import { deepMerge, GuildMessage, isGuildMessage, NonEmptyReadonly, TypedEventEmitter } from "./utils";
import * as BuiltInCommands from "./builtIn/command";
import { PrefixesPropertyAccess, validatePrefix } from "./builtIn/property/Prefixes";
import { Property } from "./database/property/Property";
import { AnyCommand } from "./command/Command";
import { Logger } from "./Logger";
import { CommandContext } from "./command/Context";

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
     * Свойство префиксов в базе данных
     */
    public readonly prefixesProperty: Property<'guild', NonEmptyReadonly<string[]>, PrefixesPropertyAccess>;

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

        this.options = deepMerge(DefaultBotOptions, options as any);

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

        this.prefixesProperty = new Property({
            key: 'prefixes',
            entityType: 'guild',
            defaultValue: this.options.guild.defaultPrefixes,
            validate: prefixes => prefixes.length > 0 && prefixes.every(validatePrefix),
            accessorClass: PrefixesPropertyAccess,
        });

        this.database.properties.add(this.prefixesProperty);

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

        const guildPrefixes = await this.database.accessProperty(message.guild, this.prefixesProperty).value();

        const prefixLength = guildPrefixes.find(p => message.cleanContent.startsWith(p))?.length ?? 0;
        if (prefixLength <= 0) {
            this.emit('guildMemberMessage', message);
            return;
        }

        const commandName = message.cleanContent.slice(prefixLength).toLowerCase().replace(/\s.*$/, '');
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
}
