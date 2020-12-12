import { createEventStorage, EmitOf } from "../event";
import { LoggerConsoleTheme, LoggerOptions } from "./Options";
import { LogType } from "./Log";

export interface Logger extends LoggerOptions { }

/**
 * Класс логгера
 */
export class Logger {
    /**
     * Уровень вложенности логов
     */
    private taskLevel: number;

    /**
     * События логгера
     */
    readonly events;

    /**
     * Приватная функция вызова событий
     */
    readonly #emit: EmitOf<Logger['events']>;

    /**
     * @param options настройки логгера
     */
    constructor(options?: Partial<LoggerOptions>) {
        const [events, emit] = createEventStorage(this, {
            log(logType: LogType, log: string) { },
        });

        this.events = events;
        this.#emit = emit;

        Object.assign(this, {
            ...options,
            hideInConsole: options?.hideInConsole ?? false,
            ignoreWarnings: options?.ignoreWarnings ?? false,
        });

        this.taskLevel = 0;
    }

    private _log(logType: LogType, log: any, taskCompleted = false) {
        if (this.ignoreWarnings && logType == 'warning') {
            return;
        }

        let strLog = String(log);
        this.#emit('log', logType, strLog);

        if (!this.hideInConsole) {
            strLog = this.consoleTheme?.(logType, strLog, this.taskLevel, taskCompleted) ?? strLog;
            console.log(strLog);
            if (log instanceof Error) {
                console.log(log.stack);
            }
        }
    }

    /**
     * Функция-подсказка анализатору кода для создания темы логгера
     * @param themeFunction функция-тема
     */
    static theme(themeFunction: LoggerConsoleTheme) {
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

    endTask(result: LogType, log: any) {
        this._log(result, log, true);
        if (this.taskLevel > 0) {
            this.taskLevel -= 1;
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
