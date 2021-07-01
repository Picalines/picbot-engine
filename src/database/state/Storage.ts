import { PromiseOrSync } from "../../utils/index.js";
import { EntityType, Entity } from "../Entity.js";
import { Selector, SelectorOptions, SelectorVars } from "../selector/index.js";
import { State, StateAccess } from "./State.js";

export interface EntityStorage<E extends EntityType> {
    accessState<T>(entity: Entity<E>, state: State<E, T>): StateAccess<T>;
    select<Vars extends SelectorVars = {}>(selector: Selector<E, Vars>, options: SelectorOptions<E, Vars>): Promise<Entity<E>[]>;
    delete(entity: Entity<E>): PromiseOrSync<void>;
    clear(): PromiseOrSync<void>;
}
