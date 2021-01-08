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
        const strLog = this.theme(String(log), logType, { taskLevel: this.taskLevel, taskCompleted });

        console.log(strLog);

        if (log instanceof Error) {
            console.log(log.stack);
        }
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

    done(result: LogType, log: any) {
        this._log(result, log, true);
        if (this.taskLevel > 0) {
            this.taskLevel -= 1;
        }
        else {
            this.warning(`${this.done.name} called before ${this.task.name}`);
        }
        return this;
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
