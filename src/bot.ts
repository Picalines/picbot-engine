import { Client, ClientOptions, Message, MessageEmbed } from "discord.js";
import { CommandStorage } from "./command/Storage";
import { CommandContext } from "./command/Context";
import { GuildMessage } from "./utils";
import { readFileSync } from "fs";

/**
 * Обёртка класса Client из discord.js,
 * в которой реализованны полезные сокращения
 */
export class Bot {
    public readonly client: Client;
    public prefix = '~';

    public commands = new CommandStorage();

    constructor(options?: ClientOptions) {
        this.client = new Client(options);
        this.initEvents();
    }

    private initEvents() {
        this.client.on('ready', () => {
            console.log("logged in as " + String(this.client.user?.username));
        });

        this.client.on('message', msg => this.handleCommands(msg));
    }

    /**
     * Обрабатывает команду в сообщении, если оно начинается с префикса команд
     * @param message сообщение
     */
    public async handleCommands(message: Message): Promise<void> {
        if (!(message.guild && message.channel.type == 'text')) return;
        if (!message.content.startsWith(this.prefix)) return;

        let content = message.content.slice(this.prefix.length);

        const commandName = content.replace(/\s.*$/, '');

        await this.catchErrorEmbedReply(message, async () => {
            const command = this.commands.getByName(commandName);
            const context = new CommandContext(this, message as GuildMessage);
            await command.execute(context);
        });
    }

    public makeErrorEmbed(error: Error) {
        return new MessageEmbed()
            .setTitle('Произошла ошибка')
            .setColor(0xd61111)
            .setDescription(error.message);
    }

    public async catchErrorEmbedReply(message: Message, tryBlock: () => any): Promise<void> {
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
