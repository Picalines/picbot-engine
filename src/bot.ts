import { Client, ClientOptions, Message, MessageEmbed } from "discord.js";
import { Command, CommandStorage, CommandHandler } from "./commands";
import { readFileSync, readdirSync } from "fs";
import { join, resolve } from "path";
import { GuildMessage } from "./utils";

/**
 * Обёртка класса Client из discord.js,
 * в которой реализованны полезные сокращения
 */
export class Bot {
    public readonly client: Client;
    public prefix = '~';

    public commandStorage = new CommandStorage();
    private commandHandler: CommandHandler;

    constructor(options?: ClientOptions) {
        this.client = new Client(options);

        this.commandHandler = new CommandHandler(this);

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

        this.commandHandler.handleMessage(message as GuildMessage, this.prefix.length);
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

    /**
     * В папке по указанному пути бот импортирует команды из всех `.js` файлов
     * Если какой-то файл в папке нужно проигнорировать, то добавьте в его module.exports
     * поле `__ignoreCommandLoading` со значением `true`
     * @param path путь до папки с командами
     * @param forgetOld выбросить ли старые команды из памяти бота, если они были
     */
    public loadCommandsInFolder(path: string, forgetOld = true): this {
        console.log(`loading commands from folder ${path}`);

        const jsFiles = readdirSync(path).filter(filename => filename.endsWith('.js'));
        if (jsFiles.length == 0) {
            throw new Error(`folder ${path} does not contain js files`);
        }

        if (forgetOld) this.commandStorage.clear();

        for (const filename of jsFiles) {
            const fullname = './' + join(path, filename);

            if (forgetOld) {
                delete require.cache[resolve(fullname)];
            }

            const exports = require.main?.require(fullname);
            if (!(exports instanceof Command)) {
                if (exports.__ignoreCommandsLoading !== true) {
                    console.error(`${fullname}: Command object expected in module.exports`);
                }
                continue;
            }

            this.commandStorage.addCommand(exports);
            console.log(`command ${exports.name} successfully loaded`);
        }

        console.log('done!');
        return this;
    }

}
