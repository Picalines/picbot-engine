import { BotOptions, BotOptionsArgument, ParseBotOptionsArgument } from "./BotOptions";
import { Client, Message, MessageEmbed, PermissionString } from "discord.js";
import { ArgumentReaderStorage } from "./command/argument/Storage";
import { GuildMessage, PromiseVoid } from "./utils";
import { CommandStorage } from "./command/Storage";
import { CommandContext } from "./command/Context";
import { readFileSync, PathLike } from "fs";
import { BotPrefixes } from "./BotPrefixes";
import HelpCommand from "./command/builtIn/Help";

/**
 * Обёртка клиента API из discord.js
 */
export class Bot {
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
    public readonly commands = new CommandStorage();

    /**
     * Префиксы бота
     */
    public readonly prefixes: BotPrefixes;

    /**
     * @param options настройки клиента API discord.js
     */
    constructor(options: BotOptionsArgument = {}) {
        this.client = new Client(options.clientOptions);

        this.options = ParseBotOptionsArgument(options);

        this.prefixes = new BotPrefixes(this);

        this.commands.register(HelpCommand.name, HelpCommand);

        this.client.on('ready', () => {
            console.log("logged in as " + String(this.client.user?.username));
        });

        this.client.on('message', message => {
            if (!(message.guild && message.channel.type == 'text')) return;

            const guildMessage = message as GuildMessage;
            if (guildMessage.member.id == guildMessage.guild.me.id) return;
            if (this.options.ignoreBots && guildMessage.author.bot) return;

            this.handleCommands(guildMessage);
        });
    }

    /**
     * Обрабатывает команду в сообщении, если оно начинается с префикса команд
     * @param message сообщение пользователя
     */
    public async handleCommands(message: GuildMessage): Promise<void> {
        const prefixLength = this.prefixes.getMessagePrefixLength(message);
        if (!prefixLength) {
            return;
        }

        const content = message.content.slice(prefixLength);
        const commandName = content.replace(/\s.*$/, '');
        if (!commandName) {
            return;
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

            const context = new CommandContext(this, message as GuildMessage, executor);
            await command.execute(context);
        });
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
