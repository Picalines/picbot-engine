import { LogType } from "./Log";

export interface LoggerConsoleTheme {
    /**
     * @param taskLevel increases in task(), decreases in endTask()
     * @param taskCompleted true in endTask()
     * @returns edited log
     */
    (logType: LogType, log: string, taskLevel: number, taskCompleted: boolean): string;
}

export interface LoggerOptions {
    readonly hideInConsole: boolean;
    readonly ignoreWarnings: boolean;
    readonly consoleTheme?: LoggerConsoleTheme;
}
