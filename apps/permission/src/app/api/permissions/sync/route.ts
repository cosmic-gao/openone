import { NextRequest, NextResponse } from 'next/server';
import type { ApiResponse, PermissionSyncRequest, Permission } from '@openone/types';
import { createLogger } from '@openone/utils';
import { dbClient, appSchema } from '@openone/database';
import { permissions as permissionsTable } from '@/db/schema';
import { eq, and } from 'drizzle-orm';

const logger = createLogger('permission-app');

/**
 * POST /api/permissions/sync
 * 同步APP的权限定义（全量替换）
 */
export async function POST(
    request: NextRequest
): Promise<NextResponse<ApiResponse<{ synced: number }>>> {
    try {
        const body: PermissionSyncRequest = await request.json();
        const { appId, appName, permissions } = body;

        if (!appId || !permissions?.length) {
            return NextResponse.json(
                { success: false, error: 'appId和permissions不能为空' },
                { status: 400 }
            );
        }

        const db = dbClient(process.env.DATABASE_URL!);

        // 1. 删除该APP下的旧权限
        await db.delete(permissionsTable).where(eq(permissionsTable.appId, appId));

        // 2. 插入新权限
        const newPermissions = permissions.map((p) => ({
            appId,
            // 确保code格式为 {appId}:{code}，避免重复拼接
            code: p.code.includes(':') && p.code.startsWith(`${appId}:`)
                ? p.code
                : `${appId}:${p.code}`,
            name: p.name,
            description: p.description,
        }));

        if (newPermissions.length > 0) {
            await db.insert(permissionsTable).values(newPermissions);
        }

        logger.info('权限同步完成', {
            appId,
            appName,
            count: newPermissions.length,
        });

        return NextResponse.json({
            success: true,
            data: { synced: newPermissions.length },
        });
    } catch (err) {
        logger.error('权限同步失败', err);
        return NextResponse.json(
            { success: false, error: '权限同步失败' },
            { status: 500 }
        );
    }
}

/**
 * GET /api/permissions/sync
 * 获取所有权限列表
 */
export async function GET(): Promise<NextResponse<ApiResponse<Permission[]>>> {
    try {
        const db = dbClient(process.env.DATABASE_URL!);
        const allPermissions = await db.select().from(permissionsTable);

        // 转换类型以匹配接口定义（drizzle返回的Date需处理，或者直接透传）
        // 这里的类型转换通常是自动兼容的
        return NextResponse.json({ success: true, data: allPermissions as any[] });
    } catch (err) {
        logger.error('获取权限列表失败', err);
        return NextResponse.json(
            { success: false, error: '获取权限列表失败' },
            { status: 500 }
        );
    }
}
