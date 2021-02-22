import { Event } from "../event/Event.js";
import { Logger } from "../logger/index.js";
import { assert } from "../utils/index.js";
import { Stage } from "./Stage.js";

export class StageSequence {
    private stages = [] as Stage[];
    private afters = new Map<string, Stage[]>();

    readonly events = Object.freeze({
        started: new Event(),
        finished: new Event(),

        stageStarted: new Event<[name: string]>(),
        stageFinished: new Event<[name: string]>(),

        stageError: new Event<[stageName: string, error: Error]>(),
    });

    add(stage: Stage) {
        if (stage.runsAfter == undefined) {
            this.stages.push(stage);

            const queue = this.afters.get(stage.name);
            if (queue?.length) {
                this.afters.delete(stage.name);
                this.stages.push(...queue);
            }

            return;
        }

        const depIndex = this.stages.findIndex(s => s.name == stage.runsAfter);
        if (depIndex >= 0) {
            this.stages.splice(depIndex + 1, 0, stage);
            return;
        }

        const queue = this.afters.get(stage.runsAfter);
        if (queue) {
            queue.push(stage);
        }
        else {
            this.afters.set(stage.runsAfter, [stage]);
        }
    }

    async run(): Promise<Error | void> {
        assert(!this.afters.size, `stage sequence is missing stage '${this.afters.keys().next().value}'`);

        this.events.started.emit();

        for (const stage of [...this.stages]) {
            this.events.stageStarted.emit(stage.name);

            try {
                await stage.task();
            }
            catch (thrown: unknown) {
                const error: Error = thrown instanceof Error ? thrown : new Error(String(thrown));
                this.events.stageError.emit(stage.name, error);
                return error;
            }

            this.events.stageFinished.emit(stage.name);
        }

        this.events.finished.emit();
    }

    useLogger(logger: Logger, options: { startedLog: () => string, finishedLog: () => string }) {
        this.events.started.on(() => logger.task(options.startedLog()));
        this.events.finished.on(() => logger.done('success', options.finishedLog()));

        this.events.stageStarted.on(name => logger.task(name));
        this.events.stageFinished.on(() => logger.done('success', ''));

        this.events.stageError.on((_, error) => logger.done('error', error));

        return this;
    }
}
