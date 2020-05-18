import { Client, ClientOptions, Message, MessageEmbed } from "discord.js";
import { EventEmitter } from "events";
import { Command } from "./commands";
import { promises } from "fs";
import { join, resolve } from "path";

/**
 * Обёртка класса Client из discord.js,
 * в которой реализованны полезные сокращения
 */
export class Bot extends EventEmitter {
    public readonly client: Client;
    public prefix: string = '~';
    private readonly _commands: Command[] = [];

    public get commands(): ReadonlyArray<Command> {
        return this._commands;
    }

    constructor(options?: ClientOptions) {
        super();
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
     * @param msg сообщение
     */
    public async handleCommands(msg: Message): Promise<void> {
        let content = msg.content;
        if (!content.startsWith(this.prefix)) return;

        content = content.slice(this.prefix.length);
        const command = this._commands.find(c => content.startsWith(c.info.name));
        if (!command) return;

        content = content.slice(command.info.name.length);

        try {
            await command.handle(this, msg, msg.content.length - content.length);
        }
        catch (err) {
            if (!(err instanceof Error)) return;
            let embed: MessageEmbed;
            try {
                embed = new MessageEmbed()
                    .setTitle('Произошла ошибка')
                    .setColor(0xd61111)
                    .setDescription(err.message);
            }
            catch {
                await msg.reply(`Произошла ошибка: ${err.message}`);
                return;
            }
            await msg.reply(embed);
        }
    }

    /**
     * Добавляет новую команду для бота
     * @param command команда
     */
    public registerCommand(command: Command): this {
        const registered = this._commands.some(c => c.mainBranch.info.name == command.info.name);
        if (registered) {
            throw new Error(`command '${command.info.name}' already registered`);
        }
        this._commands.push(command);
        return this;
    }

    public unregisterCommand(name: string): this {
        const registered = this._commands.findIndex(c => c.info.name == name);
        if (registered == -1) {
            throw new Error(`command '${name}' not registered`);
        }
        this._commands.splice(registered, 1);
        return this;
    }

    /**
     * Аналог стандартной функции client.login
     * @param token токен discord api
     */
    public async login(token: string): Promise<void> {
        await this.client.login(token);
    }

    /**
     * Сначала читает токен из файла, а потом использует
     * его в методе login
     * 
     * @param path путь до файла с токеном
     */
    public async loginFromFile(path: string): Promise<void> {
        const token = (await promises.readFile(path)).toString();
        await this.login(token);
    }

    /**
     * В папке по указанному пути бот импортирует команды из всех `.js` файлов
     * Если какой-то файл в папке нужно проигнорировать, то добавьте в его module.exports
     * поле `__ignoreCommandLoading` со значением `true`
     * @param path путь до папки с командами
     * @param forgetOld выбросить ли старые команды из памяти бота, если они были
     */
    public async loadCommandsInFolder(path: string, forgetOld = true) {
        console.log(`loading commands from folder ${path}`);
        const jsFiles = (await promises.readdir(path)).filter(filename => filename.endsWith('.js'));
        if (jsFiles.length == 0) {
            throw new Error(`folder ${path} does not contain js files`);
        }
        if (forgetOld) this._commands.length = 0;
        for (const filename of jsFiles) {
            const fullname = './' + join(path, filename);
            delete require.cache[resolve(fullname)];
            const exports = require.main?.require(fullname);
            if (!(exports instanceof Command)) {
                if (exports.__ignoreCommandsLoading === true) {
                    continue;
                }
                throw new Error(`${fullname}: Command object expected in module.exports`);
            }
            this.registerCommand(exports);
            console.log(`command ${exports.info.name} successfully loaded`);
        }
        console.log('done!');
    }
}
