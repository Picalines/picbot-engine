import { Guild } from "discord.js";
import { PromiseVoid } from "../utils/index.js";
import { Database } from "./Database.js";
import { EntityType } from "./Entity.js";
import { StateStorage } from "./state/index.js";

export interface DatabaseHandler {
    createStateStorage<E extends EntityType>(type: E): StateStorage<E>;

    prepareForLoading?(): PromiseVoid;
    loadGuild?(guild: Guild, guildState: StateStorage<'guild'>, membersState: StateStorage<'member'>): PromiseVoid;

    prepareForSaving?(): PromiseVoid;
    saveGuild?(guild: Guild, guildState: StateStorage<'guild'>, membersState: StateStorage<'member'>): PromiseVoid;
}

export interface CreateDatabaseHandler {
    (database: Database): DatabaseHandler;
}
