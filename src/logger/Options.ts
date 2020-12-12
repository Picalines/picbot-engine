import { LogType } from "./Log";

/**
 * Тема логгера в консоли
 */
export interface LoggerConsoleTheme {
    /**
     * @param logType тип лога
     * @param log лог
     * @param taskLevel уровень 'вложенности' лога (увеличивается при `task` и уменьшается при `endTask`)
     * @param taskCompleted вызывается ли тема внутри `endTask`
     * @returns новую строку лог, которая позже попадает в `console.log`
     */
    (logType: LogType, log: string, taskLevel: number, taskCompleted: boolean): string;
}

/**
 * Настройки логгера
 */
export interface LoggerOptions {
    /**
     * Спрятать все логи в консоли (событие log всё ещё работает)
     */
    readonly hideInConsole: boolean;

    /**
     * Игнорировать ли предупреждения (`logger.warning`)
     * @default false
     */
    readonly ignoreWarnings: boolean;

    /**
     * Функция 'темы' логгера. Вызывается перед `console.log`
     */
    readonly consoleTheme?: LoggerConsoleTheme;
}
