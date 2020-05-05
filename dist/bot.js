"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const discord_js_1 = require("discord.js");
const events_1 = require("events");
const commands_1 = require("./commands");
const fs_1 = require("fs");
const path_1 = require("path");
/**
 * Обёртка класса Client из discord.js,
 * в которой реализованны полезные сокращения
 */
class Bot extends events_1.EventEmitter {
    constructor(options) {
        super();
        this.prefix = '~';
        this._commands = [];
        this.client = new discord_js_1.Client(options);
        this.initEvents();
    }
    get commands() {
        return this._commands;
    }
    initEvents() {
        this.client.on('ready', () => {
            var _a;
            console.log("logged in as " + String((_a = this.client.user) === null || _a === void 0 ? void 0 : _a.username));
        });
        this.client.on('message', msg => this.handleCommands(msg));
    }
    /**
     * Обрабатывает команду в сообщении, если оно начинается с префикса команд
     * @param msg сообщение
     */
    handleCommands(msg) {
        return __awaiter(this, void 0, void 0, function* () {
            let content = msg.content;
            if (!content.startsWith(this.prefix))
                return;
            content = content.slice(this.prefix.length);
            const command = this._commands.find(c => content.startsWith(c.info.name));
            if (!command)
                return;
            content = content.slice(command.info.name.length);
            try {
                yield command.handle(this, msg, msg.content.length - content.length);
            }
            catch (err) {
                if (!(err instanceof Error))
                    return;
                let embed;
                try {
                    embed = new discord_js_1.MessageEmbed()
                        .setTitle('Произошла ошибка')
                        .setColor(0xd61111)
                        .setDescription(err.message);
                }
                catch (_a) {
                    yield msg.reply(`Произошла ошибка: ${err.message}`);
                    return;
                }
                yield msg.reply(embed);
            }
        });
    }
    /**
     * Добавляет новую команду для бота
     * @param command команда
     */
    registerCommand(command) {
        const registered = this._commands.some(c => c.mainBranch.info.name == command.info.name);
        if (registered) {
            throw new Error(`command '${command.info.name}' already registered`);
        }
        this._commands.push(command);
        return this;
    }
    unregisterCommand(name) {
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
     * @param errorCallback функция, выполняющаяся при ошибке
     */
    login(token, errorCallback = console.error) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                yield this.client.login(token);
            }
            catch (err) {
                errorCallback(err);
            }
        });
    }
    /**
     * Сначала читает токен из файла, а потом использует
     * его в методе login
     *
     * @param path путь до файла с токеном
     * @param errorCallback функция, выполняющаяся при ошибке
     */
    loginFromFile(path, errorCallback = console.error) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const token = (yield fs_1.promises.readFile(path)).toString();
                yield this.login(token, errorCallback);
            }
            catch (err) {
                errorCallback(err);
            }
        });
    }
    /**
     * В папке по указанному пути бот импортирует команды из всех `.js` файлов
     * Если какой-то файл в папке нужно проигнорировать, то добавьте в его module.exports
     * поле `__ignoreCommandLoading` со значением `true`
     * @param path путь до папки с командами
     * @param forgetOld выбросить ли старые команды из памяти бота, если они были
     */
    loadCommandsInFolder(path, errorCallback = console.error, forgetOld = true) {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            console.log(`loading commands from folder ${path}...`);
            try {
                const jsFiles = (yield fs_1.promises.readdir(path)).filter(filename => filename.endsWith('.js'));
                if (jsFiles.length == 0) {
                    throw new Error(`folder ${path} does not contain js files`);
                }
                if (forgetOld)
                    this._commands.length = 0;
                for (const filename of jsFiles) {
                    const fullname = './' + path_1.join(path, filename);
                    delete require.cache[path_1.resolve(fullname)];
                    const exports = (_a = require.main) === null || _a === void 0 ? void 0 : _a.require(fullname);
                    if (!(exports instanceof commands_1.Command)) {
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
            catch (err) {
                errorCallback(err);
            }
        });
    }
}
exports.Bot = Bot;
