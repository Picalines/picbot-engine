/// <reference types="node" />
import { Client, ClientOptions, Message } from "discord.js";
import { EventEmitter } from "events";
import { Command } from "./commands";
declare type ErrorCallback<TError extends Error = Error> = (err: TError) => void;
/**
 * Обёртка класса Client из discord.js,
 * в которой реализованны полезные сокращения
 */
export declare class Bot extends EventEmitter {
    readonly client: Client;
    prefix: string;
    private readonly _commands;
    get commands(): ReadonlyArray<Command>;
    constructor(options?: ClientOptions);
    private initEvents;
    /**
     * Обрабатывает команду в сообщении, если оно начинается с префикса команд
     * @param msg сообщение
     */
    handleCommands(msg: Message): Promise<void>;
    /**
     * Добавляет новую команду для бота
     * @param command команда
     */
    registerCommand(command: Command): this;
    unregisterCommand(name: string): this;
    /**
     * Аналог стандартной функции client.login
     * @param token токен discord api
     * @param errorCallback функция, выполняющаяся при ошибке
     */
    login(token: string, errorCallback?: ErrorCallback): Promise<void>;
    /**
     * Сначала читает токен из файла, а потом использует
     * его в методе login
     *
     * @param path путь до файла с токеном
     * @param errorCallback функция, выполняющаяся при ошибке
     */
    loginFromFile(path: string, errorCallback?: ErrorCallback): Promise<void>;
    /**
     * В папке по указанному пути бот импортирует команды из всех `.js` файлов
     * Если какой-то файл в папке нужно проигнорировать, то добавьте в его module.exports
     * поле `__ignoreCommandLoading` со значением `true`
     * @param path путь до папки с командами
     * @param forgetOld выбросить ли старые команды из памяти бота, если они были
     */
    loadCommandsInFolder(path: string, errorCallback?: ErrorCallback, forgetOld?: boolean): Promise<void>;
}
export {};
