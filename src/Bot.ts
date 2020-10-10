import { Client, Message, MessageEmbed } from "discord.js";
import { EventEmitter } from "events";
import { PathLike, readFileSync } from "fs";
import { BotOptions, BotOptionsArgument, ParseBotOptionsArgument } from "./BotOptions";
import { ArgumentReaderStorage } from "./command/argument/Storage";
import { CommandStorage } from "./command/Storage";
import { Command } from "./command/Command";
import { BotDatabase } from "./database/BotDatabase";
import { GuildBotMessage, GuildMessage, PromiseVoid } from "./utils";
import * as BuiltInCommands from "./builtIn/command";
import { prefixesProperty } from "./builtIn/property/prefixes";

export declare interface Bot {
    on(event: 'memberMessage', listener: (message: GuildMessage) => void): this;
    on(event: 'memberPlainMessage', listener: (message: GuildMessage) => void): this;
    on(event: 'memberCommandMessage', listener: (message: GuildMessage) => void): this;

    on(event: 'botMessage', listener: (message: GuildBotMessage) => void): this;
    on(event: 'myMessage', listener: (message: GuildBotMessage) => void): this;

    on(event: string, listener: Function): this;
}

/**
 * Обёртка клиента API из discord.js
 */
export class Bot extends EventEmitter {
    /**
     * Настройки бота
     */
    public readonly options: BotOptions;

    /**
     * Хранилище типов аргументов команд бота
     */
    public readonly commandArguments = new ArgumentReaderStorage();

    /**
     * Хранилище команд бота
     */
    public readonly commands = new CommandStorage();

    /**
     * База данных бота
     */
    public readonly database: BotDatabase;

    /**
     * @param client Клиент API discord.js
     * @param options настройки бота
     */
    constructor(
        public readonly client: Client,
        options: BotOptionsArgument = {}
    ) {
        super();

        this.options = ParseBotOptionsArgument(options);

        const builtInCommandsSetting = this.options.commands.builtIn as Record<string, boolean>;
        for (const builtInCommand of Object.values(BuiltInCommands)) {
            if (builtInCommandsSetting[builtInCommand.info.name]) {
                this.commands.register(builtInCommand);
            }
        }

        this.client.on('ready', () => {
            console.log("logged in as " + this.username);
        });

        this.database = new BotDatabase(this, this.options.database.handler);
        this.client.once('ready', () => {
            this.database.load();
        });

        if (this.options.database.saveOnSigint) {
            process.once('SIGINT', async () => {
                await this.database.save();
                console.log('Press Ctrl+C again to exit the program');
            });
        }

        if (this.options.commands.builtIn.prefix) {
            this.database.defineProperty(prefixesProperty);
        }

        this.client.on('message', message => {
            if (!(message.guild && message.channel.type == 'text')) return;

            const guildMessage = message as GuildMessage;

            if (guildMessage.member.id == guildMessage.guild.me.id) {
                this.emit('myMessage', message);
                return;
            }

            if (guildMessage.author.bot) {
                this.emit('botMessage', message);
                if (this.options.ignoreBots) return;
            }

            this.handleCommands(guildMessage).then(wasCommand => {
                this.emit('memberMessage', message);
                if (wasCommand) this.emit('memberCommandMessage', message);
                else this.emit('memberPlainMessage', message);
            });
        });
    }

    /**
     * @returns юзернейм бота. Если [[Client.user]] равно `undefined`, вернёт `"bot"`
     */
    public get username(): string {
        return this.client.user?.username ?? 'bot';
    }

    /**
     * Обрабатывает команду в сообщении, если оно начинается с префикса команд
     * @param message сообщение пользователя
     * @returns true, если была запущена команда
     */
    public async handleCommands(message: GuildMessage): Promise<boolean> {
        const prefixes = await this.database.accessProperty(message.guild, prefixesProperty).value();

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

        await Bot.catchErrorEmbedReply(message, async () => {
            let command: Command;
            try {
                command = this.commands.getByName(commandName);
            } catch (err) {
                if (err instanceof Error && this.options.commands.sendNotFoundError) {
                    throw err;
                }
                return;
            }

            await command.execute(this, message);
        });

        if (this.options.utils.autoStopTyping) {
            message.channel.stopTyping(true);
        }

        return true;
    }

    /**
     * Возвращает эмбед с описанием ошибки
     * @param error ошибка
     */
    public static makeErrorEmbed(error: { message: string }) {
        return new MessageEmbed()
            .setTitle('Произошла ошибка')
            .setColor(0xd61111)
            .setDescription(error.message);
    }

    /**
     * Запускает функцию `tryBlock`. В блоке `catch` бот отвечает
     * на сообщение `message` эмбедом из `makeErrorEmbed`
     * @param message сообщение, на которое бот ответит информацией об ошибке
     * @param tryBlock функция в блоке try...catch
     */
    public static async catchErrorEmbedReply(message: Message, tryBlock: () => PromiseVoid): Promise<void> {
        try {
            await tryBlock();
        }
        catch (error) {
            if (!(error instanceof Error)) return;

            let embed: MessageEmbed;
            try {
                embed = Bot.makeErrorEmbed(error);
            }
            catch {
                await message.reply(`Произошла ошибка: ${error.message}`);
                return;
            }

            await message.reply({ embed });
        }
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
    public async loginFromFile(path: PathLike) {
        return await this.login(readFileSync(path).toString());
    }
}
