/** 日志级别 */
type LogLevel = 'debug' | 'info' | 'warn' | 'error';

/** 日志级别对应的优先级 */
const LOG_LEVEL_PRIORITY: Record<LogLevel, number> = {
    debug: 0,
    info: 1,
    warn: 2,
    error: 3,
};

/**
 * 创建统一日志实例
 * @param namespace - 日志命名空间（通常为APP名称）
 * @param minLevel - 最低日志级别（低于此级别不输出）
 * @returns 日志函数集合
 * @example
 * ```ts
 * const logger = createLogger('admin-app');
 * logger.info('APP发布成功', { appId: 'order-management' });
 * ```
 */
export function createLogger(
    namespace: string,
    minLevel: LogLevel = 'info'
) {
    const minPriority = LOG_LEVEL_PRIORITY[minLevel];

    function log(level: LogLevel, message: string, meta?: unknown) {
        if (LOG_LEVEL_PRIORITY[level] < minPriority) return;

        const timestamp = new Date().toISOString();
        const prefix = `[${timestamp}] [${level.toUpperCase()}] [${namespace}]`;

        const logFn = level === 'error' ? console.error
            : level === 'warn' ? console.warn
                : console.log;

        if (meta !== undefined) {
            logFn(prefix, message, meta);
        } else {
            logFn(prefix, message);
        }
    }

    return {
        debug: (message: string, meta?: unknown) => log('debug', message, meta),
        info: (message: string, meta?: unknown) => log('info', message, meta),
        warn: (message: string, meta?: unknown) => log('warn', message, meta),
        error: (message: string, meta?: unknown) => log('error', message, meta),
    };
}
