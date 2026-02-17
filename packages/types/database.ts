/** Schema状态 */
export type SchemaStatus = 'creating' | 'active' | 'migrating' | 'archived';

/** Schema注册信息 */
export interface SchemaInfo {
    /** 自增ID */
    id: string;
    /** 所属APP */
    app: string;
    /** Schema名称 */
    name: string;
    /** 状态 */
    status: SchemaStatus;
    /** 备注 */
    remark?: string;
    /** 创建人 */
    createdBy?: string;
    /** 更新人 */
    updatedBy?: string;
    /** 创建时间 */
    createdAt: Date;
    /** 更新时间 */
    updatedAt: Date;
}

/** Schema同步请求 */
export interface SchemaSyncRequest {
    /** APP唯一标识 */
    app: string;
    /** APP名称 */
    appName: string;
    /** Schema名称 */
    name: string;
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
    name: string;
    /** 同步状态 */
    status: 'success' | 'failed';
    /** 错误信息（失败时） */
    error?: string;
}

/** 迁移历史记录 */
export interface MigrationHistory {
    /** 记录ID */
    id: string;
    /** 所属APP */
    app: string;
    /** 迁移文件名 */
    filename: string;
    /** 执行时间 */
    executed: Date;
    /** 执行结果 */
    success: boolean;
    /** 错误信息 */
    error?: string;
    /** 创建人 */
    createdBy?: string;
    /** 更新人 */
    updatedBy?: string;
    /** 创建时间 */
    createdAt: Date;
    /** 更新时间 */
    updatedAt: Date;
}
