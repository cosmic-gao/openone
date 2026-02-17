/** 用户信息 */
export interface UserInfo {
    /** 用户ID */
    id: string;
    /** 用户名 */
    username: string;
    /** 邮箱 */
    email: string;
    /** 头像URL */
    avatar?: string;
    /** 角色列表 */
    roles: string[];
    /** 权限Code列表 */
    permissions: string[];
}

/** JWT Token载荷 */
export interface TokenPayload {
    /** 用户ID */
    sub: string;
    /** 用户名 */
    username: string;
    /** 角色列表 */
    roles: string[];
    /** 权限Code列表 */
    permissions: string[];
    /** 签发时间 */
    iat: number;
    /** 过期时间 */
    exp: number;
}

/** 登录请求 */
export interface LoginRequest {
    /** 用户名 */
    username: string;
    /** 密码 */
    password: string;
}

/** 登录响应 */
export interface LoginResponse {
    /** 访问令牌 */
    accessToken: string;
    /** 刷新令牌 */
    refreshToken: string;
    /** 用户信息 */
    user: UserInfo;
}
