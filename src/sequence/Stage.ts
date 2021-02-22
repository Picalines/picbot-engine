import { PromiseVoid } from "../utils/index.js";

export interface Stage {
    readonly name: string;
    readonly runsAfter?: string;
    task(): PromiseVoid;
}
