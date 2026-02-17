import { NextRequest, NextResponse } from 'next/server';
import type { ApiResponse, UserRoleAssignRequest, Role } from '@openone/types';
import { dbClient } from '@openone/database';
import { userRoles, roles } from '@/db/schema';
import { makeLogger, withAuth } from '@openone/utils';
import { eq, and } from 'drizzle-orm';

const logger = makeLogger('permission-app');

/**
 * GET /api/user-roles?userId=xxx
 * 获取指定用户的角色列表
 */
export async function GET(
    request: NextRequest
): Promise<NextResponse<ApiResponse<Role[]>>> {
    try {
        if (!withAuth(request)) {
            return NextResponse.json(
                { success: false, error: '未授权访问' },
                { status: 401 }
            );
        }

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
            .select({
                id: roles.id,
                name: roles.name,
                description: roles.description,
                createdAt: roles.createdAt
            })
            .from(userRoles)
            .innerJoin(roles, eq(userRoles.role, roles.id))
            .where(eq(userRoles.user, userId));

        return NextResponse.json({
            success: true,
            data: userRoleList as unknown as Role[], // Role requires permissions field, strictly speaking
        });
    } catch (err) {
        logger.logError('获取用户角色失败', err);
        return NextResponse.json(
            { success: false, error: '获取用户角色失败' },
            { status: 500 }
        );
    }
}

/**
 * POST /api/user-roles
 * 为用户分配角色（全量替换）
 */
export async function POST(
    request: NextRequest
): Promise<NextResponse<ApiResponse<{ assigned: number }>>> {
    try {
        // 需要 "assign" (在 config 里不含前缀，但在 token 可能会有 permission: 前缀，取决于 sync 逻辑)
        // 之前 sync 逻辑是把 config 里的 "assign" 存为 "permission:assign"
        // 因此这里需要检查 "permission:assign"
        if (!withAuth(request, 'permission:assign')) {
            return NextResponse.json(
                { success: false, error: '权限不足：需要 permission:assign' },
                { status: 403 }
            );
        }

        const body: UserRoleAssignRequest = await request.json();
        const { userId, roleIds } = body;

        if (!userId || !Array.isArray(roleIds)) {
            return NextResponse.json(
                { success: false, error: 'userId和roleIds格式不正确' },
                { status: 400 }
            );
        }

        const db = dbClient(process.env.DATABASE_URL!);

        await db.transaction(async (tx) => {
            // 1. 删除该用户旧角色关联
            await tx.delete(userRoles).where(eq(userRoles.user, userId));

            // 2. 插入新角色关联
            if (roleIds.length > 0) {
                const newRelations = roleIds.map(rid => ({
                    user: userId,
                    role: rid
                }));
                await tx.insert(userRoles).values(newRelations);
            }
        });

        logger.logInfo('用户角色分配完成', { userId, count: roleIds.length });

        return NextResponse.json({
            success: true,
            data: { assigned: roleIds.length },
        });

    } catch (err) {
        logger.logError('用户角色分配失败', err);
        return NextResponse.json(
            { success: false, error: '用户角色分配失败' },
            { status: 500 }
        );
    }
}
