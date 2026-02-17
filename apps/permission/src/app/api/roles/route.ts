import { NextRequest, NextResponse } from 'next/server';
import type { ApiResponse, Role, Permission } from '@openone/types';
import { dbClient } from '@openone/database';
import { roles, permissions as permissionsTable, rolePermissions } from '@/db/schema';
import { createLogger, withAuth } from '@openone/utils';
import { eq, inArray } from 'drizzle-orm';

const logger = createLogger('permission-app');

/**
 * GET /api/roles
 * 获取所有角色列表（含权限列表）
 */
export async function GET(request: NextRequest): Promise<NextResponse<ApiResponse<Role[]>>> {
    try {
        if (!withAuth(request)) {
            return NextResponse.json(
                { success: false, error: '未授权访问' },
                { status: 401 }
            );
        }

        const db = dbClient(process.env.DATABASE_URL!);

        // 查询所有角色
        const allRoles = await db.select().from(roles);

        // 查询每个角色的权限Code列表
        // 这一步可以通过单独查询 role_permissions 关联表然后内存组装，避免N+1
        // 或者使用复杂的聚合查询。这里为了清晰，分两步查。

        const roleIds = allRoles.map(r => r.id);
        const rolesWithPerms: Role[] = [];

        if (roleIds.length > 0) {
            // 查询所有关联
            const relations = await db
                .select({
                    roleId: rolePermissions.role,
                    permissionCode: permissionsTable.code
                })
                .from(rolePermissions)
                .innerJoin(permissionsTable, eq(rolePermissions.permission, permissionsTable.id))
                .where(inArray(rolePermissions.role, roleIds));

            // 组装数据
            const relationMap = new Map<string, string[]>();
            relations.forEach(r => {
                if (!relationMap.has(r.roleId)) {
                    relationMap.set(r.roleId, []);
                }
                relationMap.get(r.roleId)!.push(r.permissionCode);
            });

            allRoles.forEach(role => {
                rolesWithPerms.push({
                    ...role,
                    permissions: relationMap.get(role.id) || []
                } as unknown as Role); // Cast to Role types (Role defines permissions: string[])
            });
        } else {
            allRoles.forEach(role => {
                rolesWithPerms.push({
                    ...role,
                    permissions: []
                } as unknown as Role);
            });
        }

        return NextResponse.json({
            success: true,
            data: rolesWithPerms,
        });
    } catch (err) {
        logger.error('获取角色列表失败', err);
        return NextResponse.json(
            { success: false, error: '获取角色列表失败' },
            { status: 500 }
        );
    }
}

/**
 * POST /api/roles
 * 创建新角色
 * Body: { name: string, description?: string, permissionIds?: string[] }
 */
export async function POST(
    request: NextRequest
): Promise<NextResponse<ApiResponse<Role>>> {
    try {
        // 需要 "role:manage"
        if (!withAuth(request, 'permission:role:manage')) {
            return NextResponse.json(
                { success: false, error: '权限不足：需要 permission:role:manage' },
                { status: 403 }
            );
        }

        const body = await request.json();
        const { name, description, permissionIds } = body;

        if (!name) {
            return NextResponse.json(
                { success: false, error: '角色名称不能为空' },
                { status: 400 }
            );
        }

        const db = dbClient(process.env.DATABASE_URL!);

        // 事务处理：创建角色 -> 关联权限
        const newRole = await db.transaction(async (tx) => {
            // 1. 创建角色
            const [role] = await tx
                .insert(roles)
                .values({ name, description })
                .returning();

            if (!role) throw new Error('ROLE_CREATION_FAILED');

            // 2. 关联权限
            if (permissionIds && Array.isArray(permissionIds) && permissionIds.length > 0) {
                const relations = permissionIds.map(pid => ({
                    role: role.id,
                    permission: pid
                }));
                await tx.insert(rolePermissions).values(relations);
            }

            return role;
        });

        // 构造返回对象
        const roleData: Role = {
            ...newRole,
            permissions: [] // 刚创建时返回空列表或者根据permissionIds查询code，这里简化处理
        } as unknown as Role;

        return NextResponse.json({
            success: true,
            data: roleData,
        });

    } catch (err: any) {
        logger.error('创建角色失败', err);
        // 处理唯一约束冲突等
        if (err.code === '23505') { // Postgres unique constraint violation code
            return NextResponse.json(
                { success: false, error: '角色名称已存在' },
                { status: 400 }
            );
        }
        return NextResponse.json(
            { success: false, error: '创建角色失败' },
            { status: 500 }
        );
    }
}
