/** 日志级别 */
/** 日志级别 */
type Level = 'debug' | 'info' | 'warn' | 'error';

/** 日志级别对应的优先级 */
const RANK: Record<Level, number> = {
    debug: 0,
    info: 1,
    warn: 2,
    error: 3,
};

/**
 * 创建统一日志实例
 * @param scope - 日志命名空间（通常为APP名称）
 * @param floor - 最低日志级别（低于此级别不输出）
 * @returns 日志函数集合
 * @example
 * ```ts
 * const logger = makeLogger('admin-app');
 * logger.logInfo('APP发布成功', { appId: 'order-management' });
 * ```
 */
export function makeLogger(
    scope: string,
    floor: Level = 'info'
) {
    const min = RANK[floor];

    function writeLog(level: Level, message: string, meta?: unknown) {
        if (RANK[level] < min) return;

        const timestamp = new Date().toISOString();
        const prefix = `[${timestamp}] [${level.toUpperCase()}] [${scope}]`;

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
        logDebug: (message: string, meta?: unknown) => writeLog('debug', message, meta),
        logInfo: (message: string, meta?: unknown) => writeLog('info', message, meta),
        logWarn: (message: string, meta?: unknown) => writeLog('warn', message, meta),
        logError: (message: string, meta?: unknown) => writeLog('error', message, meta),
    };
}
