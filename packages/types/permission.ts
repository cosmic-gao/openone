/** 权限定义（存储在数据库中的完整模型） */
export interface Permission {
    /** 权限ID */
    id: string;
    /** 所属APP ID */
    appId: string;
    /** 权限Code（如 order:read） */
    code: string;
    /** 权限名称 */
    name: string;
    /** 权限描述 */
    description?: string;
    /** 创建时间 */
    createdAt: Date;
}

/** 角色定义 */
export interface Role {
    /** 角色ID */
    id: string;
    /** 角色名称 */
    name: string;
    /** 角色描述 */
    description?: string;
    /** 角色拥有的权限Code列表 */
    permissions: string[];
    /** 创建时间 */
    createdAt: Date;
}

/** 权限同步请求 */
export interface PermissionSyncRequest {
    /** APP唯一标识 */
    appId: string;
    /** APP名称 */
    appName: string;
    /** 权限定义列表（全量替换） */
    permissions: {
        code: string;
        name: string;
        description?: string;
    }[];
}

/** 权限校验请求 */
export interface PermissionCheckRequest {
    /** 用户ID */
    userId: string;
    /** 要校验的权限Code */
    permissionCode: string;
}

/** 权限校验响应 */
export interface PermissionCheckResponse {
    /** 是否有权限 */
    hasPermission: boolean;
}

/** 用户角色分配请求 */
export interface UserRoleAssignRequest {
    /** 用户ID */
    userId: string;
    /** 角色ID列表（全量替换） */
    roleIds: string[];
}

/** 用户权限聚合响应 */
export interface UserPermissionsResponse {
    /** 用户ID */
    userId: string;
    /** 角色名称列表 */
    roles: string[];
    /** 权限Code列表（已去重） */
    permissions: string[];
}
