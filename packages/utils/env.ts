import type {
    AppEnvConfig,
    EnvAssignment,
    EnvOwner,
} from '@openone/types';

/**
 * 环境变量的职责前缀映射
 * 用于将环境变量按前缀自动分类到对应的管理服务
 */
const ENV_OWNER_PREFIXES: Record<string, EnvOwner> = {
    PORT: 'admin',
    APP_URL: 'admin',
    NEXT_PUBLIC_APP_URL: 'admin',
    ADMIN_APP_URL: 'admin',
    SHELL_APP_URL: 'admin',
    AUTH_APP_URL: 'admin',
    PERMISSION_APP_URL: 'admin',
    DB_MANAGER_APP_URL: 'admin',
    APP_PORT_RANGE_START: 'admin',
    APP_PORT_RANGE_END: 'admin',
    DATABASE_URL: 'database',
    SCHEMA_NAME: 'database',
    PERMISSION_SERVICE_URL: 'permission',
};

/** 前缀通配符匹配规则 */
const ENV_OWNER_WILDCARD_PREFIXES: { prefix: string; owner: EnvOwner }[] = [
    { prefix: 'DB_', owner: 'database' },
    { prefix: 'RBAC_', owner: 'permission' },
    { prefix: 'PERM_', owner: 'permission' },
];

/**
 * 判断环境变量的职责归属
 * @param key - 环境变量名
 * @returns 归属的管理服务标识
 * @example
 * ```ts
 * resolveEnvOwner('DATABASE_URL'); // 'database'
 * resolveEnvOwner('PORT'); // 'admin'
 * resolveEnvOwner('MY_CUSTOM_VAR'); // 'app'
 * ```
 */
export function resolveEnvOwner(key: string): EnvOwner {
    // 精确匹配
    const exactMatch = ENV_OWNER_PREFIXES[key];
    if (exactMatch) {
        return exactMatch;
    }
    // 前缀通配符匹配
    for (const { prefix, owner } of ENV_OWNER_WILDCARD_PREFIXES) {
        if (key.startsWith(prefix)) {
            return owner;
        }
    }
    return 'app';
}

/**
 * 将环境变量集合按职责分类
 * @param vars - 原始环境变量键值对
 * @returns 按 Admin/Database/Permission/App 分类的结果
 * @example
 * ```ts
 * const result = categorizeEnvVars({
 *   PORT: '4001',
 *   DATABASE_URL: 'postgresql://...',
 *   MY_VAR: 'value',
 * });
 * // result.adminVars = { PORT: '4001' }
 * // result.databaseVars = { DATABASE_URL: 'postgresql://...' }
 * // result.appVars = { MY_VAR: 'value' }
 * ```
 */
export function categorizeEnvVars(
    vars: Record<string, string>
): EnvAssignment {
    const result: EnvAssignment = {
        adminVars: {},
        databaseVars: {},
        permissionVars: {},
        appVars: {},
    };

    for (const [key, value] of Object.entries(vars)) {
        const owner = resolveEnvOwner(key);
        switch (owner) {
            case 'admin':
                result.adminVars[key] = value;
                break;
            case 'database':
                result.databaseVars[key] = value;
                break;
            case 'permission':
                result.permissionVars[key] = value;
                break;
            default:
                result.appVars[key] = value;
        }
    }

    return result;
}

/**
 * 根据 AppEnvConfig 生成 .env 文件内容
 * @param config - APP环境变量配置
 * @returns .env 文件文本内容
 * @example
 * ```ts
 * const content = generateEnvFile({
 *   appId: 'order',
 *   port: 4001,
 *   url: 'http://localhost:4001',
 *   databaseUrl: 'postgresql://...',
 *   schemaName: 'order',
 *   permissionServiceUrl: 'http://localhost:3003',
 *   databaseServiceUrl: 'http://localhost:3004',
 *   adminServiceUrl: 'http://localhost:3002',
 *   custom: {},
 * });
 * ```
 */
export function generateEnvFile(config: AppEnvConfig): string {
    const lines: string[] = [
        `# === ${config.appId} APP 环境配置（由 Admin APP 自动生成） ===`,
        `# 生成时间: ${new Date().toISOString()}`,
        '',
        '# --- Admin APP 管理 ---',
        `PORT=${config.port}`,
        `NEXT_PUBLIC_APP_URL=${config.url}`,
        `ADMIN_APP_URL=${config.adminServiceUrl}`,
        '',
        '# --- Database APP 管理 ---',
        `DATABASE_URL=${config.databaseUrl}`,
        `SCHEMA_NAME=${config.schemaName}`,
        '',
        '# --- Permission APP 管理 ---',
        `PERMISSION_APP_URL=${config.permissionServiceUrl}`,
        '',
        '# --- 服务发现 ---',
        `DB_MANAGER_APP_URL=${config.databaseServiceUrl}`,
    ];

    // 追加自定义环境变量
    const customEntries = Object.entries(config.custom);
    if (customEntries.length > 0) {
        lines.push('', '# --- APP 自定义变量 ---');
        for (const [key, value] of customEntries) {
            lines.push(`${key}=${value}`);
        }
    }

    lines.push(''); // 文件末尾空行
    return lines.join('\n');
}

/**
 * 解析 .env 文件内容为键值对
 * 忽略注释行和空行
 * @param content - .env 文件文本内容
 * @returns 环境变量键值对
 */
export function parseEnvFile(
    content: string
): Record<string, string> {
    const result: Record<string, string> = {};

    for (const rawLine of content.split('\n')) {
        const line = rawLine.trim();
        // 跳过空行和注释
        if (!line || line.startsWith('#')) {
            continue;
        }
        const eqIndex = line.indexOf('=');
        if (eqIndex === -1) {
            continue;
        }
        const key = line.substring(0, eqIndex).trim();
        const value = line.substring(eqIndex + 1).trim();
        if (key) {
            result[key] = value;
        }
    }

    return result;
}

/**
 * 分配APP端口号
 * 在指定范围内为APP生成确定性端口（基于appId哈希）
 * @param appId - APP标识
 * @param rangeStart - 端口范围起始（默认4000）
 * @param rangeEnd - 端口范围结束（默认4999）
 * @returns 分配的端口号
 */
export function resolveAppPort(
    appId: string,
    rangeStart = 4000,
    rangeEnd = 4999
): number {
    // 使用简单哈希确保同一 appId 总是映射到同一端口
    let hash = 0;
    for (let i = 0; i < appId.length; i++) {
        const char = appId.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // 转32位整数
    }
    const range = rangeEnd - rangeStart + 1;
    const offset = Math.abs(hash) % range;
    return rangeStart + offset;
}

/**
 * 生成APP的访问URL
 * @param appId - APP标识
 * @param domain - 域名（默认 localhost）
 * @param port - 端口号
 * @returns 完整的访问URL
 */
export function resolveAppUrl(
    appId: string,
    domain = 'localhost',
    port?: number
): string {
    const resolvedPort = port ?? resolveAppPort(appId);
    const protocol = domain === 'localhost' ? 'http' : 'https';
    return `${protocol}://${domain}:${resolvedPort}`;
}

/**
 * 合并多个环境变量分配为一个 .env 内容
 * @param assignment - 按职责分类的环境变量
 * @returns 合并后的 .env 文件内容
 */
export function mergeEnvAssignment(
    assignment: EnvAssignment
): string {
    const lines: string[] = [];

    const sections: { label: string; vars: Record<string, string> }[] = [
        { label: 'Admin APP 管理', vars: assignment.adminVars },
        { label: 'Database APP 管理', vars: assignment.databaseVars },
        { label: 'Permission APP 管理', vars: assignment.permissionVars },
        { label: 'APP 自定义变量', vars: assignment.appVars },
    ];

    for (const section of sections) {
        const entries = Object.entries(section.vars);
        if (entries.length === 0) continue;
        lines.push(`# --- ${section.label} ---`);
        for (const [key, value] of entries) {
            lines.push(`${key}=${value}`);
        }
        lines.push('');
    }

    return lines.join('\n');
}
