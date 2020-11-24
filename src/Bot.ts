import { Client } from "discord.js";
import { EventEmitter } from "events";
import { promises } from "fs";
import { BotOptions, BotOptionsArgument, ParseBotOptionsArgument } from "./BotOptions";
import { CommandStorage } from "./command/Storage";
import { BotDatabase } from "./database/BotDatabase";
import { GuildMessage, isGuildMessage, NonEmptyReadonly, TypedEventEmitter } from "./utils";
import * as BuiltInCommands from "./builtIn/command";
import { PrefixesPropertyAccess, validatePrefix } from "./builtIn/property/Prefixes";
import { Property } from "./database/property/Property";
import { AnyCommand } from "./command/Command";
import { Logger } from "./Logger";

interface BotEvents {
    memberMessage(message: GuildMessage): void;
    memberPlainMessage(message: GuildMessage): void;

    botMessage(message: GuildMessage): void;
    myMessage(message: GuildMessage): void;

    commandError(message: GuildMessage, error: Error, command?: AnyCommand): void;
    commandExecuted(message: GuildMessage): void;
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

        this.options = ParseBotOptionsArgument(options);

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
            if (!isGuildMessage(message)) {
                return;
            }

            if (message.member.id == message.guild.me.id) {
                this.emit('myMessage', message);
                return;
            }

            if (message.author.bot) {
                this.emit('botMessage', message);
                if (this.options.ignoreBots) return;
            }

            this.handleCommand(message).then(wasCommand => {
                this.emit('memberMessage', message);
                this.emit(wasCommand ? 'commandExecuted' : 'memberPlainMessage', message);
            });
        });

        this.on('commandError', message => {
            message.channel.stopTyping(true);
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
     * @returns true, если команда успешно выполнена
     */
    public async handleCommand(message: GuildMessage): Promise<boolean> {
        const guildPrefixes = await this.database.accessProperty(message.guild, this.prefixesProperty).value();

        const prefixLength = guildPrefixes.find(p => message.cleanContent.startsWith(p))?.length ?? 0;
        if (prefixLength <= 0) {
            return false;
        }

        const commandName = message.cleanContent.slice(prefixLength).toLowerCase().replace(/\s.*$/, '');
        if (!commandName) {
            return false;
        }

        let command: AnyCommand | undefined;

        try {
            command = this.commands.get(commandName);
            if (command === undefined) {
                if (this.options.commands.sendNotFoundError) {
                    throw new Error(`command '${commandName}' not found`);
                }
                return false;
            }

            await command.execute(this, message);
        }
        catch (error: unknown) {
            this.emit('commandError', message, error instanceof Error ? error : new Error(String(error)), command);
            return false;
        }

        if (this.options.utils.autoStopTyping) {
            message.channel.stopTyping(true);
        }

        return true;
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
