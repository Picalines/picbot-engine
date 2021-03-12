import { Logger, LogType } from "./Logger.js";

const prefixes: Record<LogType, string> = {
    log: '',
    warning: '33m⚠',
    error: '31m✘',
    task: '34m➭',
    success: '32m√',
};

export const pipeLoggerTheme = Logger.theme((log, type, { taskLevel: level, taskCompleted: completed }) => {
    if (prefixes[type]) {
        log = `\x1b[${prefixes[type]}\x1b[0m ${log}`;
    }

    if (level == 0 && type != 'task') {
        return log;
    }

    if (type != 'task' || (type == 'task' && level > 0)) {
        return (level > 1 ? '║ '.repeat(level - 1) : '')
            + (completed ? '╙' : (log.trim() ? '╠═' : '║'))
            + (type == 'task' ? '╦' : '')
            + ' ' + log;
    }

    return '╓ ' + log;
});
