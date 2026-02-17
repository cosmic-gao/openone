import { NextRequest, NextResponse } from 'next/server';
import type { ApiResponse, UserPermissionsResponse } from '@openone/types';
import { dbClient } from '@openone/database';
import { userRoles, rolePermissions, permissions, roles } from '@/db/schema';
import { createLogger } from '@openone/utils';
import { eq } from 'drizzle-orm';

const logger = createLogger('permission-app');

/**
 * GET /api/permissions/user?userId=xxx
 * 获取用户所有权限（聚合去重）
 */
export async function GET(
    request: NextRequest
): Promise<NextResponse<ApiResponse<UserPermissionsResponse>>> {
    try {
        const { searchParams } = new URL(request.url);
        const userId = searchParams.get('userId');

        if (!userId) {
            return NextResponse.json(
                { success: false, error: 'userId不能为空' },
                { status: 400 }
            );
        }

        const db = dbClient(process.env.DATABASE_URL!);

        // 查询用户角色
        const userRoleList = await db
            .select({ name: roles.name })
            .from(userRoles)
            .innerJoin(roles, eq(userRoles.role, roles.id))
            .where(eq(userRoles.user, userId));

        // 查询用户权限
        const userPermList = await db
            .select({ code: permissions.code })
            .from(userRoles)
            .innerJoin(roles, eq(userRoles.role, roles.id))
            .innerJoin(rolePermissions, eq(roles.id, rolePermissions.role))
            .innerJoin(permissions, eq(rolePermissions.permission, permissions.id))
            .where(eq(userRoles.user, userId));

        // 去重权限code
        const uniquePerms = Array.from(new Set(userPermList.map(p => p.code)));

        return NextResponse.json({
            success: true,
            data: {
                userId,
                roles: userRoleList.map(r => r.name),
                permissions: uniquePerms
            },
        });

    } catch (err) {
        logger.error('获取用户权限失败', err);
        return NextResponse.json(
            { success: false, error: '获取用户权限失败' },
            { status: 500 }
        );
    }
}
