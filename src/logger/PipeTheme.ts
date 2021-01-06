import { Logger, LogType } from "./Logger";

const prefixes: Partial<Record<LogType, string>> = {
    warning: '\x1b[33m⚠',
    error: '\x1b[31m✘',
    task: '\x1b[34m➭',
    success: '\x1b[32m√',
};

export const pipeLoggerTheme = Logger.theme((log, type, { taskLevel: level, taskCompleted: completed }) => {
    if (prefixes[type]) {
        log = prefixes[type] + '\x1b[0m ' + log;
    }

    if (level == 0 && type != 'task') {
        return log;
    }

    if (type != 'task' || (type == 'task' && level > 0)) {
        return (level > 1 ? '║ '.repeat(level - 1) : '') + (completed ? '╙' : (log.trim() ? '╠═' : '║')) + (type == 'task' ? '╦' : '') + ' ' + log;
    }

    return '╓ ' + log;
});
