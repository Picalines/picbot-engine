import { Event } from "../event/Event.js";
import { PromiseVoid } from "../utils/index.js";
import { Bot } from "./Bot.js";

export class BotEventListener<E extends Event<any>> {
    constructor(
        readonly event: (bot: Bot) => E,
        readonly listener: (bot: Bot, ...args: E extends Event<infer Args> ? Args : never) => PromiseVoid,
    ) {
        Object.freeze(this);
    }
}
