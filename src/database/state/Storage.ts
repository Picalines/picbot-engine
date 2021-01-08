import { PromiseOrSync } from "../../utils/index.js";
import { EntityType, Entity } from "../Entity.js";
import { AnyExpression, EntitySelector, SelectorVarsDefinition, SelectorVars } from "../selector/index.js";
import { State } from "./State.js";

export interface StateStorage<E extends EntityType> {
    store<T>(entity: Entity<E>, state: State<E, T>, value: T): PromiseOrSync<void>;
    restore<T>(entity: Entity<E>, state: State<E, T>): PromiseOrSync<T | undefined>;

    delete(entity: Entity<E>, state: State<E, any>): PromiseOrSync<void>;
    deleteEntity(entity: Entity<E>): PromiseOrSync<void>;
    clear(): PromiseOrSync<void>;

    selectEntities<Vars extends SelectorVarsDefinition = {}>(entities: IterableIterator<Entity<E>>, selector: EntitySelector<E, Vars>, expression: AnyExpression<E>, variables: SelectorVars<Vars>): AsyncGenerator<Entity<E>> | Generator<Entity<E>>;
}
