import { PromiseOrSync } from "../../utils/index.js";
import { EntityType, Entity } from "../Entity.js";
import { AnyExpression, Selector, SelectorVarsDefinition, SelectorVars } from "../selector/index.js";
import { State, StateAccess } from "./State.js";

export interface EntityStorage<E extends EntityType> {
    accessState<T>(entity: Entity<E>, state: State<E, T>): StateAccess<T>;

    delete(entity: Entity<E>): PromiseOrSync<void>;

    clear(): PromiseOrSync<void>;

    select<Vars extends SelectorVarsDefinition = {}>(entities: IterableIterator<Entity<E>>, selector: Selector<E, Vars>, expression: AnyExpression<E>, variables: SelectorVars<Vars>): AsyncGenerator<Entity<E>> | Generator<Entity<E>>;
}
