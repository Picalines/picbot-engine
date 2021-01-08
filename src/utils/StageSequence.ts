import { PromiseVoid } from "./UsefulTypes.js";
import { assert } from "./UsefulFunctions.js";

interface Stage {
    readonly name: string;
    task(): PromiseVoid;
}

export class StageSequenceBuilder {
    private stages = [] as Stage[];
    private afters = new Map<string, Stage[]>();

    stage(name: string, task: Stage['task']) {
        const stage: Stage = { name, task };

        this.stages.push(stage);

        const aftersQueue = this.afters.get(name);
        if (aftersQueue) {
            this.afters.delete(name);
            for (const { name: afterName, task: afterTask } of aftersQueue) {
                this.stage(afterName, afterTask);
            }
        }
    }

    after(after: string, name: string, task: Stage['task']) {
        const stage: Stage = { name, task };

        const afterIndex = this.stages.findIndex(s => s.name === after);
        if (afterIndex >= 0) {
            this.stages.splice(afterIndex + 1, 0, stage);
            return;
        }

        const aftersQueue = this.afters.get(after);
        if (!aftersQueue) {
            this.afters.set(after, [stage]);
            return;
        }

        aftersQueue.push(stage);
    }

    build(): Stage[] {
        assert(!this.afters.size, `sequence is missing stage '${this.afters.keys().next().value}'`);
        assert(this.stages.length, `sequence is empty`);
        return [...this.stages];
    }
}
