import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import {
    generateAccessToken,
    generateRefreshToken,
    createLogger,
} from '@openone/utils';
import type { ApiResponse, LoginResponse, UserInfo, UserPermissionsResponse } from '@openone/types';
import { dbClient } from '@openone/database';
import { users } from '@/db/schema';
import { eq } from 'drizzle-orm';

const logger = createLogger('auth-app');
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-me';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'dev-refresh-secret';
// 注意：容器内通信通常用 http://permission:3000 或 localhost:端口，视部署环境而定
// 这里使用 generateEnvFile 生成的 PERMISSION_SERVICE_URL 环境变量
const PERMISSION_SERVICE_URL = process.env.PERMISSION_SERVICE_URL || 'http://localhost:3003';

/**
 * POST /api/login
 * 处理用户登录请求
 */
export async function POST(
    request: NextRequest
): Promise<NextResponse<ApiResponse<LoginResponse>>> {
    try {
        const body = await request.json();
        const { username, password } = body;

        // 参数校验
        if (!username || !password) {
            return NextResponse.json(
                { success: false, error: '用户名和密码不能为空', code: 'INVALID_PARAMS' },
                { status: 400 }
            );
        }

        const db = dbClient(process.env.DATABASE_URL!);

        // 1. 查找用户
        const [user] = await db
            .select()
            .from(users)
            .where(eq(users.username, username));

        if (!user) {
            return NextResponse.json(
                { success: false, error: '用户名或密码错误', code: 'AUTH_FAILED' },
                { status: 401 }
            );
        }

        // 2. 校验密码
        const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
        if (!isPasswordValid) {
            return NextResponse.json(
                { success: false, error: '用户名或密码错误', code: 'AUTH_FAILED' },
                { status: 401 }
            );
        }

        // 3. 获取用户权限（从 Permission APP）
        let roles: string[] = [];
        let permissions: string[] = [];

        try {
            const permRes = await fetch(`${PERMISSION_SERVICE_URL}/api/permissions/user?userId=${user.id}`, {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' },
            });

            if (permRes.ok) {
                const permData: ApiResponse<UserPermissionsResponse> = await permRes.json();
                if (permData.success && permData.data) {
                    roles = permData.data.roles;
                    permissions = permData.data.permissions;
                }
            } else {
                logger.warn('获取用户权限失败: Permission APP返回非200状态', { status: permRes.status });
            }
        } catch (err) {
            logger.warn('获取用户权限失败: 无法连接Permission APP', err);
            // 降级处理：登录成功但不带权限，或者从 Token 中省略权限
        }

        // 4. 生成Token
        const userInfo: UserInfo = {
            id: user.id,
            username: user.username,
            email: user.email || '', // 处理 email 可能不存在的情况（视 schema 定义）
            roles,
            permissions,
        };

        // 生成 Token 时会把 roles 和 permissions 放入 payload
        const accessToken = generateAccessToken(userInfo, JWT_SECRET);
        const refreshToken = generateRefreshToken(user.id, JWT_REFRESH_SECRET);

        logger.info('用户登录成功', { userId: user.id, username: user.username });

        return NextResponse.json({
            success: true,
            data: { accessToken, refreshToken, user: userInfo },
        });
    } catch (err) {
        logger.error('登录处理失败', err);
        return NextResponse.json(
            { success: false, error: '服务器内部错误', code: 'INTERNAL_ERROR' },
            { status: 500 }
        );
    }
}
