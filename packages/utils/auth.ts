import jwt from 'jsonwebtoken';
import type { TokenPayload, UserInfo } from '@openone/types';

const LIFE = '2h';
const LIMIT = '7d';

/**
 * 生成JWT访问令牌
 * @param user - 用户信息
 * @param secret - JWT密钥
 * @param time - 过期时间，默认2小时
 * @returns 签名后的JWT字符串
 * @example
 * ```ts
 * const token = signAccess(user, 'my-secret');
 * ```
 */
export function signAccess(
    user: UserInfo,
    secret: string,
    time: string = LIFE
): string {
    const payload: Omit<TokenPayload, 'iat' | 'exp'> = {
        sub: user.id,
        username: user.username,
        roles: user.roles,
        permissions: user.permissions,
    };
    return jwt.sign(payload, secret, { expiresIn: time as any });
}

/**
 * 生成JWT刷新令牌
 * @param userId - 用户ID
 * @param secret - 刷新令牌密钥
 * @param time - 过期时间，默认7天
 * @returns 签名后的JWT字符串
 */
export function signRefresh(
    userId: string,
    secret: string,
    time: string = LIMIT
): string {
    return jwt.sign({ sub: userId }, secret, { expiresIn: time as any });
}

/**
 * 验证并解析JWT Token
 * @param token - JWT字符串
 * @param secret - JWT密钥
 * @returns 解析后的Token载荷，无效时返回null
 * @example
 * ```ts
 * const payload = checkToken(token, 'my-secret');
 * if (payload) console.log(payload.sub);
 * ```
 */
export function checkToken(
    token: string,
    secret: string
): TokenPayload | null {
    try {
        return jwt.verify(token, secret) as TokenPayload;
    } catch {
        return null;
    }
}

/**
 * 从Authorization Header中提取Token
 * @param header - Authorization头部值（Bearer xxx）
 * @returns Token字符串，格式不匹配返回null
 */
export function parseHeader(header?: string): string | null {
    if (!header?.startsWith('Bearer ')) return null;
    return header.slice(7);
}
