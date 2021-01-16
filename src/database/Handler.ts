import { Guild } from "discord.js";
import { PromiseOrSync, PromiseVoid, UnionToIntersection } from "../utils/index.js";
import { Database } from "./Database.js";
import { EntityManager, EntityType } from "./Entity.js";
import { StateStorage } from "./state/index.js";

type LoadMethods<E extends EntityType> = {
    readonly [K in `load${Capitalize<E>}sState`]: (manager: EntityManager<E>) => PromiseOrSync<StateStorage<E>>;
}

type SaveMethods<E extends EntityType> = {
    readonly [K in `save${Capitalize<E>}sState`]?: (manager: EntityManager<E>) => PromiseVoid;
}

type Methods = UnionToIntersection<{ [E in EntityType]: LoadMethods<E> & SaveMethods<E> }[EntityType]>;

export interface DatabaseHandler extends Methods {
    prepareForLoading?(): PromiseVoid;
    prepareForSaving?(): PromiseVoid;
    prepareCreatedGuild(guild: Guild): PromiseOrSync<StateStorage<'member'>>;
}

export interface CreateDatabaseHandler {
    (database: Database): DatabaseHandler;
}
