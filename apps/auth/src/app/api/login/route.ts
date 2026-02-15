import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import {
    generateAccessToken,
    generateRefreshToken,
} from '@openone/utils';
import type { ApiResponse, LoginResponse, UserInfo } from '@openone/types';

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-me';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'dev-refresh-secret';

/**
 * 临时内存用户存储（后续替换为数据库查询）
 * 默认管理员账号: admin / admin123
 */
const MOCK_USERS = [
    {
        id: '1',
        username: 'admin',
        // bcrypt hash for "admin123"
        passwordHash: bcrypt.hashSync('admin123', 10),
        email: 'admin@openone.dev',
        roles: ['admin'],
    },
];

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

        // 查找用户
        const user = MOCK_USERS.find((u) => u.username === username);
        if (!user) {
            return NextResponse.json(
                { success: false, error: '用户名或密码错误', code: 'AUTH_FAILED' },
                { status: 401 }
            );
        }

        // 校验密码
        const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
        if (!isPasswordValid) {
            return NextResponse.json(
                { success: false, error: '用户名或密码错误', code: 'AUTH_FAILED' },
                { status: 401 }
            );
        }

        // 生成Token
        const userInfo: UserInfo = {
            id: user.id,
            username: user.username,
            email: user.email,
            roles: user.roles,
        };
        const accessToken = generateAccessToken(userInfo, JWT_SECRET);
        const refreshToken = generateRefreshToken(user.id, JWT_REFRESH_SECRET);

        return NextResponse.json({
            success: true,
            data: { accessToken, refreshToken, user: userInfo },
        });
    } catch {
        return NextResponse.json(
            { success: false, error: '服务器内部错误', code: 'INTERNAL_ERROR' },
            { status: 500 }
        );
    }
}
