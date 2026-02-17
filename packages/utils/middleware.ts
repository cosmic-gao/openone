import { NextRequest } from 'next/server';
import { verifyToken, extractBearerToken } from './auth';
import type { TokenPayload } from '@openone/types';

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-me';

/**
 * 通用鉴权中间件辅助函数
 * 从请求中提取并验证用户身份和权限
 * @param request - NextRequest 请求对象
 * @param requiredPermission - 可选，需要的权限 code (如 "schema:read")
 * @returns 验证后的 TokenPayload，验证失败返回 null
 * @example
 * ```ts
 * const user = withAuth(req, 'user:manage');
 * if (!user) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
 * ```
 */
export function withAuth(
    request: NextRequest,
    requiredPermission?: string
): TokenPayload | null {
    // 1. 提取 Token
    const authHeader = request.headers.get('Authorization') || undefined;
    const token = extractBearerToken(authHeader);

    if (!token) {
        return null;
    }

    // 2. 验证 Token
    const payload = verifyToken(token, JWT_SECRET);
    if (!payload) {
        return null; // Token 无效或过期
    }

    // 3. 检查权限 (如果有要求)
    if (requiredPermission) {
        // payload.permissions 包含该用户所有的权限 code
        if (!payload.permissions || !payload.permissions.includes(requiredPermission)) {
            return null; // 权限不足
        }
    }

    return payload;
}
