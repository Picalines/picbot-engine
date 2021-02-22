import { PromiseVoid } from "../utils/index.js";
import { Bot } from "./Bot.js";

interface Definition {
    initialize(bot: Bot): PromiseVoid;
    deinitialize?(bot: Bot): PromiseVoid;
}

export interface BotInitializer extends Definition { }

export class BotInitializer {
    constructor(definition: Definition) {
        Object.assign(this, definition);
        Object.freeze(this);
    }
}
