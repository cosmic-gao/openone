import { NextRequest, NextResponse } from 'next/server';
import type { ApiResponse, PermissionCheckRequest, PermissionCheckResponse } from '@openone/types';
import { dbClient } from '@openone/database';
import { userRoles, rolePermissions, permissions, roles } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { makeLogger } from '@openone/utils';

const logger = makeLogger('permission-app');

/**
 * POST /api/permissions/check
 * 校验用户是否拥有指定权限
 */
export async function POST(
    request: NextRequest
): Promise<NextResponse<ApiResponse<PermissionCheckResponse>>> {
    try {
        const body: PermissionCheckRequest = await request.json();
        const { userId, permissionCode } = body;

        if (!userId || !permissionCode) {
            return NextResponse.json(
                { success: false, error: 'userId和permissionCode不能为空' },
                { status: 400 }
            );
        }

        const db = dbClient(process.env.DATABASE_URL!);

        // 查询用户是否有该权限
        // 链路: user_roles -> roles -> role_permissions -> permissions
        // 优化查询：直接查是否存在满足条件的记录
        const result = await db
            .select({ code: permissions.code })
            .from(userRoles)
            .innerJoin(roles, eq(userRoles.role, roles.id))
            .innerJoin(rolePermissions, eq(roles.id, rolePermissions.role))
            .innerJoin(permissions, eq(rolePermissions.permission, permissions.id))
            .where(
                and(
                    eq(userRoles.user, userId),
                    eq(permissions.code, permissionCode)
                )
            )
            .limit(1);

        const hasPermission = result.length > 0;

        return NextResponse.json({
            success: true,
            data: { hasPermission },
        });
    } catch (err) {
        logger.logError('权限校验失败', err);
        return NextResponse.json(
            { success: false, error: '权限校验失败' },
            { status: 500 }
        );
    }
}
