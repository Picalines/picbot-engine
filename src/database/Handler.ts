import { Guild } from "discord.js";
import { PromiseVoid } from "../utils";
import { BotDatabase } from "./BotDatabase";
import { EntityType } from "./Entity";
import { DatabaseValueStorageConstructor } from "./property/ValueStorage";

export abstract class BotDatabaseHandler {
    constructor(readonly propertyStorageClass: DatabaseValueStorageConstructor<EntityType>) { }

    onGuildCreate?(database: BotDatabase, guild: Guild): PromiseVoid;
    onGuildDelete?(database: BotDatabase, guild: Guild): PromiseVoid;

    prepareForLoading?(database: BotDatabase): PromiseVoid;
    loadGuild?(database: BotDatabase, guild: Guild): PromiseVoid;
    onLoaded?(database: BotDatabase): PromiseVoid;

    prepareForSaving?(database: BotDatabase): PromiseVoid;
    saveGuild?(database: BotDatabase, guild: Guild): PromiseVoid;
    onSaved?(database: BotDatabase): PromiseVoid;
}
