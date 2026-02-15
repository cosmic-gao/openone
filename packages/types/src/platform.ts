/** APP状态 */
export type AppStatus = 'draft' | 'published' | 'archived';

/** APP注册信息（平台侧） */
export interface AppRegistration {
    /** 自增ID */
    id: number;
    /** APP唯一标识 */
    appId: string;
    /** APP显示名称 */
    appName: string;
    /** APP描述 */
    description?: string;
    /** 状态 */
    status: AppStatus;
    /** 最新版本号 */
    latestVersion?: string;
    /** 菜单配置 */
    menuConfig: import('./app').MenuItem[];
    /** APP访问地址 */
    url?: string;
    /** 创建时间 */
    createdAt: Date;
    /** 更新时间 */
    updatedAt: Date;
}

/** APP版本记录 */
export interface AppVersion {
    /** 版本ID */
    id: number;
    /** 所属APP ID */
    appId: string;
    /** 版本号 */
    version: string;
    /** 静态资源路径 */
    filePath: string;
    /** 完整配置 */
    config: import('./app').AppConfig;
    /** 发布时间 */
    publishedAt?: Date;
    /** 创建时间 */
    createdAt: Date;
}

/** 统一API响应格式 */
export interface ApiResponse<T = unknown> {
    /** 是否成功 */
    success: boolean;
    /** 响应数据 */
    data?: T;
    /** 错误信息 */
    error?: string;
    /** 错误码 */
    code?: string;
}

/** 分页参数 */
export interface PaginationParams {
    /** 页码（从1开始） */
    page: number;
    /** 每页数量 */
    pageSize: number;
}

/** 分页响应 */
export interface PaginatedResponse<T> {
    /** 数据列表 */
    items: T[];
    /** 总数 */
    total: number;
    /** 当前页码 */
    page: number;
    /** 每页数量 */
    pageSize: number;
}

/** Wujie通信事件类型 */
export type BusEvents = {
    /** Token过期通知 */
    'token:expired': void;
    /** 菜单刷新通知 */
    'menu:refresh': void;
    /** 全局消息通知 */
    'notification:show': {
        type: 'success' | 'error' | 'info' | 'warning';
        message: string;
    };
    /** 路由跳转请求 */
    'route:navigate': {
        appId: string;
        path: string;
    };
};
