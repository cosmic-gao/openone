/** Schema状态 */
export type SchemaStatus = 'creating' | 'active' | 'migrating' | 'archived';

/** Schema注册信息 */
export interface SchemaInfo {
    /** 自增ID */
    id: number;
    /** 所属APP ID */
    appId: string;
    /** Schema名称（{id}_{name} 格式） */
    schemaName: string;
    /** 状态 */
    status: SchemaStatus;
    /** 创建时间 */
    createdAt: Date;
    /** 更新时间 */
    updatedAt: Date;
}

/** Schema同步请求 */
export interface SchemaSyncRequest {
    /** APP唯一标识 */
    appId: string;
    /** APP名称（用于Schema命名） */
    appName: string;
    /** Schema名称 */
    schemaName: string;
    /** 迁移文件内容列表 */
    migrations: MigrationFile[];
}

/** 迁移文件 */
export interface MigrationFile {
    /** 文件名 */
    filename: string;
    /** SQL内容 */
    content: string;
}

/** Schema同步结果 */
export interface SchemaSyncResult {
    /** 完整Schema名称 */
    schemaName: string;
    /** 同步状态 */
    status: 'success' | 'failed';
    /** 错误信息（失败时） */
    error?: string;
}

/** 迁移历史记录 */
export interface MigrationHistory {
    /** 记录ID */
    id: number;
    /** 所属APP ID */
    appId: string;
    /** 迁移文件名 */
    filename: string;
    /** 执行时间 */
    executedAt: Date;
    /** 执行结果 */
    success: boolean;
    /** 错误信息 */
    error?: string;
}
