/**
 * APP配置文件类型定义
 * 对应用户APP根目录的 openone.config.json
 */
export interface AppConfig {
    /** APP唯一标识（英文，如 order-management） */
    appId: string;
    /** APP显示名称 */
    appName: string;
    /** 版本号（语义化版本） */
    version: string;
    /** 菜单配置列表 */
    menus: MenuItem[];
    /** 权限声明列表 */
    permissions: PermissionDefinition[];
    /** 数据库配置 */
    database: DatabaseConfig;
}

/** 菜单项定义 */
export interface MenuItem {
    /** 菜单唯一标识 */
    key: string;
    /** 菜单显示文本 */
    label: string;
    /** 菜单图标（Lucide Icon名称） */
    icon?: string;
    /** 子APP内的路由路径 */
    path: string;
    /** 子菜单 */
    children?: MenuItem[];
    /** 权限标识（用于菜单过滤） */
    permissionCode?: string;
}

/** 权限声明 */
export interface PermissionDefinition {
    /** 权限Code（如 order:read） */
    code: string;
    /** 权限名称 */
    name: string;
    /** 权限描述 */
    description?: string;
}

/** 数据库配置 */
export interface DatabaseConfig {
    /** PG Schema 名称（与 pgSchema() 中的名称一致） */
    schemaName: string;
    /** 迁移文件目录（相对于APP根目录） */
    migrations: string;
}
