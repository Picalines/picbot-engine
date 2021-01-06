import { GuildMemberManager, GuildManager } from "discord.js";
import { EntityType, Entity } from "../Entity";
import { SelectorVarsDefinition, SelectorVars } from "./Selector";

export type EntitySelectorOptions<E extends EntityType, Vars extends SelectorVarsDefinition> = {
    readonly manager: E extends 'member' ? GuildMemberManager : GuildManager;

    readonly filter?: (entity: Entity<E>) => boolean;

    readonly maxCount?: number;

    readonly throwOnNotFound?: Error;

} & ({} extends Vars ? {} : {

    readonly variables: SelectorVars<Vars>;
});
