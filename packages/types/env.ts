/**
 * APP环境变量相关类型定义
 * 描述环境变量由 Admin/Database/Permission 三大核心服务分别管理的结构
 */

/** 环境变量职责归属 */
export type EnvOwner = 'admin' | 'database' | 'permission' | 'app';

/**
 * APP环境变量完整配置（由Admin APP汇总后分发）
 * @example
 * ```ts
 * const envConfig: AppEnvConfig = {
 *   appId: 'order-management',
 *   port: 4001,
 *   url: 'http://localhost:4001',
 *   databaseUrl: 'postgresql://...',
 *   schemaName: 'order_management',
 *   permissionServiceUrl: 'http://localhost:3003',
 *   databaseServiceUrl: 'http://localhost:3004',
 *   adminServiceUrl: 'http://localhost:3002',
 *   custom: { ORDER_TIMEOUT: '3600' },
 * };
 * ```
 */
export interface AppEnvConfig {
    /** APP唯一标识 */
    appId: string;
    /** 分配的端口号 */
    port: number;
    /** 分配的访问URL */
    url: string;
    /** 数据库连接URL（由Database APP分配） */
    databaseUrl: string;
    /** PG Schema名称 */
    schemaName: string;
    /** 权限服务地址 */
    permissionServiceUrl: string;
    /** 数据库管理服务地址 */
    databaseServiceUrl: string;
    /** Admin服务地址 */
    adminServiceUrl: string;
    /** APP自定义环境变量 */
    custom: Record<string, string>;
}

/**
 * 环境变量分配结果（按职责分类）
 * Admin/Database/Permission 各自管理一部分变量
 */
export interface EnvAssignment {
    /** Admin职责：端口、域名、服务URL */
    adminVars: Record<string, string>;
    /** Database职责：DATABASE_URL、SCHEMA_NAME */
    databaseVars: Record<string, string>;
    /** Permission职责：RBAC配置 */
    permissionVars: Record<string, string>;
    /** APP自身变量（不由平台管理） */
    appVars: Record<string, string>;
}

/**
 * 端口分配记录
 * Admin APP维护的端口分配注册表
 */
export interface PortAssignment {
    /** APP标识 */
    appId: string;
    /** 分配的端口 */
    port: number;
    /** 分配时间 */
    assignedAt: Date;
}

/**
 * 环境变量分发请求
 * Admin APP接收的分发请求体
 */
export interface EnvAssignRequest {
    /** APP标识 */
    appId: string;
    /** APP显示名称 */
    appName: string;
    /** 数据库Schema名称（可选，无则不分配数据库配置） */
    schemaName?: string;
    /** APP自定义环境变量 */
    customEnv?: Record<string, string>;
}

/**
 * 环境变量分发响应
 */
export interface EnvAssignResponse {
    /** 分配的端口 */
    port: number;
    /** 分配的URL */
    url: string;
    /** 按职责分类的环境变量 */
    assignment: EnvAssignment;
    /** 合并后的完整 .env 文件内容 */
    envFileContent: string;
}
