import { Bot } from "../bot/Bot.js";
import { PromiseOrSync } from "../utils/index.js";
import { LoggerTheme } from "./Theme.js";

export type LogType =
    | "log"
    | "warning"
    | "error"
    | "task"
    | "success";

export class Logger {
    private taskLevel = 0;
    private taskCompleted = false;

    constructor(readonly bot: Bot) { }

    log(log: any, type: LogType = 'log') {
        const { loggerTheme: theme } = this.bot.options;

        if (log instanceof Error) {
            console.log(theme('', type, { taskLevel: this.taskLevel, taskCompleted: this.taskCompleted }))
            console.log(log.stack);
        }
        else {
            console.log(theme(String(log), type, { taskLevel: this.taskLevel, taskCompleted: this.taskCompleted }));
        }

        return this;
    }

    task(log: any) {
        this.log(log, 'task');
        this.taskLevel += 1;
        return this;
    }

    done(result: Exclude<LogType, 'task' | 'log'>, log: any) {
        this.taskCompleted = true;
        this.log(log, result);
        this.taskCompleted = false;
        if (this.taskLevel > 0) {
            this.taskLevel -= 1;
        }
        else {
            this.warning(`${this.done.name} called before ${this.task.name}`);
        }
        return this;
    }

    async promiseTask<T>(task: any, block: () => PromiseOrSync<T>, successLog: any = ''): Promise<T> {
        this.task(task);
        try {
            const result = await block();
            this.done('success', successLog);
            return result;
        }
        catch (error) {
            this.done('error', error);
            throw error;
        }
    }

    success(log: any = '') {
        return this.log(log, 'success');
    }

    warning(log: any = '') {
        return this.log(log, 'warning');
    }

    error(log: any = '') {
        return this.log(log, 'error');
    }

    /**
     * type hint
     */
    static theme(themeFunction: LoggerTheme) {
        return themeFunction;
    }
}
