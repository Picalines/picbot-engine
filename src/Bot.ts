import { Client, ClientOptions, Message, MessageEmbed } from "discord.js";
import { CommandStorage } from "./command/Storage";
import { CommandContext } from "./command/Context";
import { GuildMessage, PromiseVoid, nameof } from "./utils";
import { readFileSync } from "fs";
import { ArgumentReaderStorage } from "./command/argument/Storage";

export class Bot {
    public readonly client: Client;

    public readonly commandArguments = new ArgumentReaderStorage();
    public readonly commands = new CommandStorage();

    public readCommandPrefix?: (message: GuildMessage) => number | undefined;

    constructor(options?: ClientOptions) {
        this.client = new Client(options);

        this.client.on('ready', () => {
            console.log("logged in as " + String(this.client.user?.username));
        });

        this.client.on('message', msg => this.handleCommands(msg));
    }

    public setPrefix(prefix: string): never | void {
        if (this.readCommandPrefix) {
            throw new Error(`prefix already defined in bot.${nameof<Bot>('readCommandPrefix')}`);
        }
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
     * @param message сообщение
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
            const context = new CommandContext(this, message as GuildMessage);
            await command.execute(context);
        });
    }

    /**
     * Возвращает эмбед с описанием ошибки
     */
    public makeErrorEmbed(error: Error) {
        return new MessageEmbed()
            .setTitle('Произошла ошибка')
            .setColor(0xd61111)
            .setDescription(error.message);
    }

    /**
     * Запускает функцию `tryBlock`. В блоке `catch` бот отвечает
     * на сообщение `message` эмбедом из `makeErrorEmbed`
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
