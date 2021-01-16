import { PromiseOrSync } from "../../utils/index.js";
import { EntityType, Entity } from "../Entity.js";
import { AnyExpression, EntitySelector, SelectorVarsDefinition, SelectorVars } from "../selector/index.js";
import { State } from "./State.js";

export interface EntityStateStorage<E extends EntityType> {
    store<T>(state: State<E, T>, value: T): PromiseOrSync<void>;
    restore<T>(state: State<E, T>): PromiseOrSync<T | undefined>;
    reset(state: State<E, any>): PromiseOrSync<void>;
}

export interface StateStorage<E extends EntityType> {
    entity(entity: Entity<E>): EntityStateStorage<E>;

    delete(entity: Entity<E>): PromiseOrSync<void>;
    clear(): PromiseOrSync<void>;

    select<Vars extends SelectorVarsDefinition = {}>(entities: IterableIterator<Entity<E>>, selector: EntitySelector<E, Vars>, expression: AnyExpression<E>, variables: SelectorVars<Vars>): AsyncGenerator<Entity<E>> | Generator<Entity<E>>;
}
