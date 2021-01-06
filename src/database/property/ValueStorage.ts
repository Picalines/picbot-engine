import { PromiseOrSync } from "../../utils";
import { BotDatabase } from "../BotDatabase";
import { EntityType, Entity } from "../Entity";
import { AnyExpression, EntitySelector, SelectorVarsDefinition, SelectorVars } from "../selector";

export abstract class DatabaseValueStorage<E extends EntityType> {
    constructor(
        readonly database: BotDatabase,
        readonly entityType: E,
    ) { }

    abstract storeValue<T>(entity: Entity<E>, key: string, value: T): PromiseOrSync<void>;

    abstract restoreValue<T>(entity: Entity<E>, key: string): PromiseOrSync<T | undefined>;

    abstract deleteValue(entity: Entity<E>, key: string): PromiseOrSync<boolean>;

    abstract selectEntities<Vars extends SelectorVarsDefinition = {}>(entities: IterableIterator<Entity<E>>, selector: EntitySelector<E, Vars>, expression: AnyExpression<E>, variables: SelectorVars<Vars>): AsyncGenerator<Entity<E>> | Generator<Entity<E>>;

    /**
     * called when bot leaves guild
     */
    abstract cleanup(): PromiseOrSync<void>;

    abstract cleanupEntity(entity: Entity<E>): PromiseOrSync<void>;
}

export type DatabaseValueStorageConstructor<E extends EntityType> = new (database: BotDatabase, entityType: E) => DatabaseValueStorage<E>;
