import { NextRequest, NextResponse } from 'next/server';
import type { ApiResponse, Role } from '@openone/types';
import { dbClient } from '@openone/database';
import { roles, rolePermissions, permissions as permissionsTable } from '@/db/schema';
import { createLogger } from '@openone/utils';
import { eq } from 'drizzle-orm';

const logger = createLogger('permission-app');

/**
 * GET /api/roles/[id]
 * 获取角色详情（含权限）
 */
export async function GET(
    request: NextRequest,
    context: { params: Promise<{ id: string }> }
): Promise<NextResponse<ApiResponse<Role>>> {
    try {
        const { id } = await context.params;
        const db = dbClient(process.env.DATABASE_URL!);

        const [role] = await db.select().from(roles).where(eq(roles.id, id));

        if (!role) {
            return NextResponse.json(
                { success: false, error: '角色不存在' },
                { status: 404 }
            );
        }

        // 查询权限
        const permissions = await db
            .select({ code: permissionsTable.code })
            .from(rolePermissions)
            .innerJoin(permissionsTable, eq(rolePermissions.permission, permissionsTable.id))
            .where(eq(rolePermissions.role, id));

        const roleData = {
            ...role,
            permissions: permissions.map(p => p.code)
        };

        return NextResponse.json({
            success: true,
            data: roleData as unknown as Role,
        });

    } catch (err) {
        logger.error('获取角色详情失败', err);
        return NextResponse.json(
            { success: false, error: '获取角色详情失败' },
            { status: 500 }
        );
    }
}

/**
 * PUT /api/roles/[id]
 * 更新角色（名称、描述、权限）
 */
export async function PUT(
    request: NextRequest,
    context: { params: Promise<{ id: string }> }
): Promise<NextResponse<ApiResponse<Role>>> {
    try {
        const { id } = await context.params;
        const body = await request.json();
        const { name, description, permissionIds } = body;

        const db = dbClient(process.env.DATABASE_URL!);

        const updatedRole = await db.transaction(async (tx) => {
            // 1. 更新基本信息
            const [role] = await tx
                .update(roles)
                .set({
                    name,
                    description,
                    // updatedAt: new Date() // 如果 schema 有 updatedAt 字段
                })
                .where(eq(roles.id, id))
                .returning();

            if (!role) {
                throw new Error('ROLE_NOT_FOUND');
            }

            // 2. 更新权限关联（如果有传 permissionIds）
            if (permissionIds && Array.isArray(permissionIds)) {
                // 删除旧关联
                await tx.delete(rolePermissions).where(eq(rolePermissions.role, id));

                // 插入新关联
                if (permissionIds.length > 0) {
                    const relations = permissionIds.map(pid => ({
                        role: id,
                        permission: pid
                    }));
                    await tx.insert(rolePermissions).values(relations);
                }
            }

            return role;
        });

        return NextResponse.json({
            success: true,
            data: updatedRole as unknown as Role, // 简化处理，不重新查权限列表
        });

    } catch (err: any) {
        if (err.message === 'ROLE_NOT_FOUND') {
            return NextResponse.json(
                { success: false, error: '角色不存在' },
                { status: 404 }
            );
        }
        logger.error('更新角色失败', err);
        return NextResponse.json(
            { success: false, error: '更新角色失败' },
            { status: 500 }
        );
    }
}

/**
 * DELETE /api/roles/[id]
 * 删除角色
 */
export async function DELETE(
    request: NextRequest,
    context: { params: Promise<{ id: string }> }
): Promise<NextResponse<ApiResponse<{ deleted: boolean }>>> {
    try {
        const { id } = await context.params;
        const db = dbClient(process.env.DATABASE_URL!);

        // 由于设置了 ON DELETE CASCADE，直接删除角色即可
        // 关联的 user_roles 和 role_permissions 会自动删除
        await db.delete(roles).where(eq(roles.id, id));

        logger.info('角色删除完成', { roleId: id });

        return NextResponse.json({
            success: true,
            data: { deleted: true },
        });
    } catch (err) {
        logger.error('删除角色失败', err);
        return NextResponse.json(
            { success: false, error: '删除角色失败' },
            { status: 500 }
        );
    }
}
