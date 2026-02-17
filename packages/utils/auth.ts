import jwt from 'jsonwebtoken';
import type { TokenPayload, UserInfo } from '@openone/types';

const DEFAULT_ACCESS_EXPIRY = '2h';
const DEFAULT_REFRESH_EXPIRY = '7d';

/**
 * 生成JWT访问令牌
 * @param user - 用户信息
 * @param secret - JWT密钥
 * @param expiresIn - 过期时间，默认2小时
 * @returns 签名后的JWT字符串
 * @example
 * ```ts
 * const token = generateAccessToken(user, 'my-secret');
 * ```
 */
export function generateAccessToken(
    user: UserInfo,
    secret: string,
    expiresIn: string = DEFAULT_ACCESS_EXPIRY
): string {
    const payload: Omit<TokenPayload, 'iat' | 'exp'> = {
        sub: user.id,
        username: user.username,
        roles: user.roles,
        permissions: user.permissions,
    };
    return jwt.sign(payload, secret, { expiresIn: expiresIn as any });
}

/**
 * 生成JWT刷新令牌
 * @param userId - 用户ID
 * @param secret - 刷新令牌密钥
 * @param expiresIn - 过期时间，默认7天
 * @returns 签名后的JWT字符串
 */
export function generateRefreshToken(
    userId: string,
    secret: string,
    expiresIn: string = DEFAULT_REFRESH_EXPIRY
): string {
    return jwt.sign({ sub: userId }, secret, { expiresIn: expiresIn as any });
}

/**
 * 验证并解析JWT Token
 * @param token - JWT字符串
 * @param secret - JWT密钥
 * @returns 解析后的Token载荷，无效时返回null
 * @example
 * ```ts
 * const payload = verifyToken(token, 'my-secret');
 * if (payload) console.log(payload.sub);
 * ```
 */
export function verifyToken(
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
export function extractBearerToken(header?: string): string | null {
    if (!header?.startsWith('Bearer ')) return null;
    return header.slice(7);
}
