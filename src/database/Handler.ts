import { Guild } from "discord.js";
import { PromiseVoid } from "../utils";
import { Database } from "./Database";
import { EntityType } from "./Entity";
import { StateStorage } from "./state";

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
