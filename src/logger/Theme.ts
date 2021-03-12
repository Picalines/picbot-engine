import { LogType } from "./Logger.js";

interface ThemeContext {
    /**
     * increases in startTask(), decreases in endTask()
     */
    readonly taskLevel: number;

    /**
     * true in endTask()
     */
    readonly taskCompleted: boolean;
}

export interface LoggerTheme {
    /**
     * @returns edited log
     */
    (log: string, logType: LogType, context: ThemeContext): string;
}
