import { LoggerTheme, LoggerOptions } from "./Options.js";

export type LogType =
    | "log"
    | "warning"
    | "error"
    | "task"
    | "success";

export interface Logger extends LoggerOptions { }

export class Logger {
    private taskLevel = 0;

    constructor(options: Partial<LoggerOptions>) {
        Object.assign(this, {
            hide: options.hide ?? false,
            theme: options.theme ?? ((_, log) => log)
        });

        if (this.hide) {
            this._log = () => { };
        }
    }

    private _log = (logType: LogType, log: any, taskCompleted = false) => {
        if (log instanceof Error) {
            console.log(this.theme('', logType, { taskLevel: this.taskLevel, taskCompleted }))
            console.log(log.stack);
            return;
        }

        const strLog = this.theme(String(log), logType, { taskLevel: this.taskLevel, taskCompleted });
        console.log(strLog);
    }

    /**
     * type hint
     */
    static theme(themeFunction: LoggerTheme) {
        return themeFunction;
    }

    task(log: any) {
        this._log('task', log);
        this.taskLevel += 1;
        return this;
    }

    success(log: any) {
        this._log('success', log);
        return this;
    }

    done(result: Exclude<LogType, 'task' | 'log'>, log: any) {
        this._log(result, log, true);
        if (this.taskLevel > 0) {
            this.taskLevel -= 1;
        }
        else {
            this.warning(`${this.done.name} called before ${this.task.name}`);
        }
        return this;
    }

    async promiseTask<T>(task: any, block: () => Promise<T>, successLog: any = ''): Promise<T> {
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

    log(log: any) {
        this._log('log', log);
        return this;
    }

    warning(log: any) {
        this._log('warning', log);
        return this;
    }

    error(log: any) {
        this._log('error', log);
        return this;
    }
}
