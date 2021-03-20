import { EntityType, EntityManager } from "../Entity.js";
import { SelectorVars, SelectorVarValues } from "./Selector.js";

export type SelectorOptions<E extends EntityType, Vars extends SelectorVars = {}> = {
    readonly manager: EntityManager<E>;

    readonly maxCount?: number;

    readonly variables?: {};

} & ({} extends Vars ? {} : {

    readonly variables: SelectorVarValues<Vars>;
});
