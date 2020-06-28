import { Client, ClientOptions, Message, MessageEmbed, PermissionResolvable } from "discord.js";
import { ArgumentReaderStorage } from "./command/argument/Storage";
import { GuildMessage, PromiseVoid, nameof } from "./utils";
import { CommandStorage } from "./command/Storage";
import { CommandContext } from "./command/Context";
import { readFileSync } from "fs";

/**
 * Обёртка клиента API из discord.js
 */
export class Bot {
    /**
     * Клиент API discord.js
     */
    public readonly client: Client;

    /**
     * Хранилище типов аргументов команд бота
     */
    public readonly commandArguments = new ArgumentReaderStorage();

    /**
     * Хранилище команд бота
     */
    public readonly commands = new CommandStorage();

    /**
     * Функция, читающая префикс команды в сообщении.
     * Возвращает длину префикса. Если префикс не найден,
     * должна вернуть 0 или undefined.
     */
    public readCommandPrefix?: (message: GuildMessage) => number | undefined;

    /**
     * @param options настройки клиента API discord.js
     */
    constructor(options?: ClientOptions) {
        this.client = new Client(options);

        this.client.on('ready', () => {
            console.log("logged in as " + String(this.client.user?.username));
        });

        this.client.on('message', msg => this.handleCommands(msg));
    }

    /**
     * Устанавливает боту единственный префикс команд.
     * (Меняет значение `readCommandPrefix`)
     * @param prefix префикс команд
     */
    public setPrefix(prefix: string): never | void {
        if (!prefix || prefix.includes(' ')) {
            throw new Error(`invalid prefix '${prefix}'`);
        }
        this.readCommandPrefix = message => {
            if (message.content.startsWith(prefix)) {
                return prefix.length;
            }
        }
    }

    /**
     * Обрабатывает команду в сообщении, если оно начинается с префикса команд
     * @param message сообщение пользователя
     */
    public async handleCommands(message: Message): Promise<void> {
        if (!this.readCommandPrefix) {
            console.warn(`bot.${nameof<Bot>('readCommandPrefix')} is undefined, so commands are ignored`);
            return;
        }

        if (!(message.guild && message.channel.type == 'text')) return;

        const prefixLength = this.readCommandPrefix(message as GuildMessage);
        if (!prefixLength) {
            return;
        }

        let content = message.content.slice(prefixLength);

        const commandName = content.replace(/\s.*$/, '');

        await this.catchErrorEmbedReply(message, async () => {
            const command = this.commands.getByName(commandName);
            const memberPermissions = (message as GuildMessage).member.permissions;
            const commandPermissions = (command.permissions || []) as PermissionResolvable[];
            if (!memberPermissions.has(commandPermissions)) {
                throw new Error("Not enough permissions");
            }
            const context = new CommandContext(this, message as GuildMessage);
            await command.execute(context);
        });
    }

    /**
     * Возвращает эмбед с описанием ошибки
     * @param error ошибка
     */
    public makeErrorEmbed(error: Error | { message: string }) {
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
    public async catchErrorEmbedReply(message: Message, tryBlock: () => PromiseVoid): Promise<void> {
        try {
            await tryBlock();
        }
        catch (error) {
            if (!(error instanceof Error)) return;

            let embed: MessageEmbed;
            try {
                embed = this.makeErrorEmbed(error);
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
    public async loginFromFile(path: string) {
        return await this.login(readFileSync(path).toString());
    }
}
