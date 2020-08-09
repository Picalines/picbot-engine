import { Client, Message, MessageEmbed, PermissionString } from "discord.js";
import { EventEmitter } from "events";
import { PathLike, readFileSync } from "fs";
import { BotOptions, BotOptionsArgument, ParseBotOptionsArgument } from "./BotOptions";
import * as BuiltInCommands from "./builtIn/command";
import { ArgumentReaderStorage } from "./command/argument/Storage";
import { CommandContext } from "./command/Context";
import { CommandStorage } from "./command/Storage";
import { BotDatabase } from "./database/Bot";
import { GuildBotMessage, GuildMessage, PromiseVoid } from "./utils";

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
     * Клиент API discord.js
     */
    public readonly client: Client;

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
    public readonly commands: CommandStorage;

    /**
     * База данных бота
     */
    public readonly database: BotDatabase;

    /**
     * @param options настройки клиента API discord.js
     */
    constructor(options: BotOptionsArgument = {}) {
        super();

        this.client = new Client(options.clientOptions);

        this.options = ParseBotOptionsArgument(options);

        this.commands = new CommandStorage(this.commandArguments);

        const builtInCommandsSetting = this.options.commands.builtIn as Record<string, boolean>;
        for (const builtInCommand of Object.values(BuiltInCommands)) {
            if (builtInCommandsSetting[builtInCommand.name]) {
                this.commands.register(builtInCommand.name, builtInCommand);
            }
        }

        if (this.options.database.handler) {
            this.database = new BotDatabase(this, this.options.database.handler);
            this.client.once('ready', () => {
                this.database.load();
            });
        }
        else {
            this.database = null as any;
        }

        this.client.on('ready', () => {
            console.log("logged in as " + String(this.client.user?.username));
        });

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
        const { prefixes } = await this.database.getGuildData(message.guild);

        const lowerContent = message.content.toLowerCase();
        let prefixLength = 0;
        for (const prefix of prefixes) {
            if (lowerContent.startsWith(prefix)) {
                prefixLength = prefix.length;
                break;
            }
        }

        if (!prefixLength) {
            return false;
        }

        const content = message.content.slice(prefixLength);
        const commandName = content.replace(/\s.*$/, '');
        if (!commandName) {
            return false;
        }

        const executor = message.member;

        await Bot.catchErrorEmbedReply(message, async () => {
            const command = this.commands.getByName(commandName);

            const commandPermissions = (command.permissions || []) as PermissionString[];
            const checkAdmin = this.options.permissions.checkAdmin;
            const missingPermissions = executor.permissions.missing(commandPermissions, checkAdmin);
            if (missingPermissions.length) {
                throw new Error(`Not enough permissions: ${missingPermissions.join(', ')}`);
            }

            const context = new CommandContext(command, this, message as GuildMessage, executor);
            await command.execute(context);
        });

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

            await message.reply(embed);
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
