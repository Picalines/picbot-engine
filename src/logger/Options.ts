import { LogType } from "./Logger";

interface ThemeContext {
    /**
     * increases in task(), decreases in done()
     */
    readonly taskLevel: number;

    /**
     * true in done()
     */
    readonly taskCompleted: boolean;
}

export interface LoggerTheme {
    /**
     * @returns edited log
     */
    (log: string, logType: LogType, context: ThemeContext): string;
}

export interface LoggerOptions {
    /**
     * @default false
     */
    readonly hide: boolean;

    /**
     * @default pipeLoggerTheme
     */
    readonly theme: LoggerTheme;
}
