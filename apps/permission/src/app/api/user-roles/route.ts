import { NextRequest, NextResponse } from 'next/server';
import type { ApiResponse, UserRoleAssignRequest, Role } from '@openone/types';
import { dbClient } from '@openone/database';
import { userRoles, roles } from '@/db/schema';
import { createLogger } from '@openone/utils';
import { eq, and } from 'drizzle-orm';

const logger = createLogger('permission-app');

/**
 * GET /api/user-roles?userId=xxx
 * 获取指定用户的角色列表
 */
export async function GET(
    request: NextRequest
): Promise<NextResponse<ApiResponse<Role[]>>> {
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
            .select({
                id: roles.id,
                name: roles.name,
                description: roles.description,
                createdAt: roles.createdAt
            })
            .from(userRoles)
            .innerJoin(roles, eq(userRoles.roleId, roles.id))
            .where(eq(userRoles.userId, userId));

        return NextResponse.json({
            success: true,
            data: userRoleList as unknown as Role[], // Role requires permissions field, strictly speaking
        });
    } catch (err) {
        logger.error('获取用户角色失败', err);
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
            await tx.delete(userRoles).where(eq(userRoles.userId, userId));

            // 2. 插入新角色关联
            if (roleIds.length > 0) {
                const newRelations = roleIds.map(rid => ({
                    userId,
                    roleId: rid
                }));
                await tx.insert(userRoles).values(newRelations);
            }
        });

        logger.info('用户角色分配完成', { userId, count: roleIds.length });

        return NextResponse.json({
            success: true,
            data: { assigned: roleIds.length },
        });

    } catch (err) {
        logger.error('用户角色分配失败', err);
        return NextResponse.json(
            { success: false, error: '用户角色分配失败' },
            { status: 500 }
        );
    }
}
