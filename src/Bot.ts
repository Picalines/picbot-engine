import { Client, Message, MessageEmbed } from "discord.js";
import { EventEmitter } from "events";
import { PathLike, readFileSync } from "fs";
import { BotOptions, BotOptionsArgument, ParseBotOptionsArgument } from "./BotOptions";
import { CommandStorage } from "./command/Storage";
import { BotDatabase } from "./database/BotDatabase";
import { GuildBotMessage, GuildMessage, PromiseVoid, TypedEventEmitter } from "./utils";
import * as BuiltInCommands from "./builtIn/command";
import { PrefixesPropertyAccess, validatePrefix } from "./builtIn/property/Prefixes";
import { Property } from "./database/property/Property";
import { AnyCommand } from "./command/Command";

interface BotEvents {
    memberMessage(message: GuildMessage): void;
    memberPlainMessage(message: GuildMessage): void;
    memberCommandMessage(message: GuildMessage): void;

    botMessage(message: GuildBotMessage): void;
    myMessage(message: GuildBotMessage): void;

    commandError(commandMessage: GuildMessage, error: Error, command?: AnyCommand): void;
}

/**
 * Обёртка клиента API из discord.js
 */
export class Bot extends (EventEmitter as new () => TypedEventEmitter<BotEvents>) {
    /**
     * Настройки бота
     */
    public readonly options: BotOptions;

    /**
     * Хранилище команд бота
     */
    public readonly commands = new CommandStorage();

    /**
     * Свойство префиксов в базе данных
     */
    public readonly prefixesProperty: Property<'guild', string[], PrefixesPropertyAccess>;

    /**
     * База данных бота
     */
    public readonly database: BotDatabase;

    /**
     * @param client Клиент API discord.js
     * @param options настройки бота
     */
    constructor(readonly client: Client, options: BotOptionsArgument = {}) {
        super();

        this.options = ParseBotOptionsArgument(options);

        const builtInCommandsSetting = this.options.commands.builtIn as Record<string, boolean>;
        for (const builtInCommand of Object.values(BuiltInCommands)) {
            if (builtInCommandsSetting[builtInCommand.name]) {
                this.commands.add(builtInCommand as unknown as AnyCommand);
            }
        }

        this.client.on('ready', () => {
            console.log("logged in as " + this.username);
        });

        this.database = new BotDatabase(this, this.options.database.handler);

        if (this.options.database.saveOnSigint) {
            process.once('SIGINT', async () => {
                await this.database.save();
                console.log('Press Ctrl+C again to exit the program');
            });
        }

        this.prefixesProperty = new Property({
            key: 'prefixes',
            entityType: 'guild',
            defaultValue: this.options.guild.defaultPrefixes as any,
            validate: prefixes => prefixes.length > 0 && prefixes.every(validatePrefix),
            accessorClass: PrefixesPropertyAccess,
        });

        this.database.definedProperties.add(this.prefixesProperty);

        for (const property of this.options.database.definedProperties) {
            this.database.definedProperties.add(property);
        }

        this.commands.on('added', command => {
            command.requiredProperties?.forEach(property => {
                this.database.definedProperties.add(property);
            });
        });

        this.client.once('ready', () => {
            this.database.load();
        });

        this.client.on('message', message => {
            if (!(message.guild && message.channel.type == 'text')) return;

            const guildMessage = message as GuildMessage;

            if (guildMessage.member.id == guildMessage.guild.me.id) {
                this.emit('myMessage', message as GuildBotMessage);
                return;
            }

            if (guildMessage.author.bot) {
                this.emit('botMessage', message as GuildBotMessage);
                if (this.options.ignoreBots) return;
            }

            this.handleCommand(guildMessage).then(wasCommand => {
                this.emit('memberMessage', guildMessage);
                if (wasCommand) this.emit('memberCommandMessage', guildMessage);
                else this.emit('memberPlainMessage', guildMessage);
            });
        });

        this.on('commandError', (message, error) => {
            message.reply({ embed: this.options.errorEmbed(error, message, this) });
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
        const prefixesProp = this.database.accessProperty(message.guild, this.prefixesProperty);

        let prefixes = await prefixesProp.value();
        if (!prefixes.length) {
            prefixes = this.options.guild.defaultPrefixes as any;
            await prefixesProp.set(prefixes);
        }

        let prefixLength = 0;
        for (const prefix of prefixes) {
            if (message.cleanContent.startsWith(prefix)) {
                prefixLength = prefix.length;
                break;
            }
        }

        if (!prefixLength) {
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

            message.channel.stopTyping(true);

            return false;
        }

        if (this.options.utils.autoStopTyping) {
            message.channel.stopTyping(true);
        }

        return true;
    }

    /**
     * Аналог стандартной функции client.login
     * @param token токен discord api
     */
    public async login(token: string): Promise<this> {
        await this.client.login(token);
        return this;
    }

    /**
     * Сначала читает токен из файла, а потом использует его в методе login
     * @param path путь до файла с токеном
     */
    public loginFromFile(path: PathLike) {
        return this.login(readFileSync(path).toString());
    }
}
