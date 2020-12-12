import { DefinitionToListener, EventStorage } from "./EventStorage";
import { Bot } from "../bot";

/**
 * Хранилище слушателя события
 */
export class BotEventListener<
    ES extends EventStorage<any, any>,
    Emitter extends ES extends EventStorage<infer E, any> ? E : never,
    Events extends ES extends EventStorage<Emitter, infer E> ? E : never,
    Event extends keyof Events>
{
    /**
     * Подключает слушатель события к хранилищу
     */
    readonly connect: (bot: Bot) => void;

    /**
    * @param emitter функция, возвращающая хранилище событий
    * @param event имя события
    * @param listener слушатель события
    */
    constructor(
        emitter: (bot: Bot) => ES,
        event: Event,
        listener: DefinitionToListener<Emitter, Events, Event>,
    ) {
        this.connect = bot => emitter(bot).on(event, listener as any);
    }
}
