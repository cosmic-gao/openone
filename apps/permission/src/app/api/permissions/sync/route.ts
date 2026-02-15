import { NextRequest, NextResponse } from 'next/server';
import type { ApiResponse, PermissionSyncRequest, Permission } from '@openone/types';
import { createLogger } from '@openone/utils';

const logger = createLogger('permission-app');

/**
 * 权限存储（内存版，后续替换为数据库）
 * Key: appId, Value: 权限列表
 */
const permissionStore = new Map<string, Permission[]>();

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

        // 全量替换该APP的权限
        const permissionRecords: Permission[] = permissions.map((p, index) => ({
            id: `${appId}_${index}`,
            appId,
            code: `${appId}:${p.code}`,
            name: p.name,
            description: p.description,
            createdAt: new Date(),
        }));

        permissionStore.set(appId, permissionRecords);

        logger.info('权限同步完成', {
            appId,
            appName,
            count: permissionRecords.length,
        });

        return NextResponse.json({
            success: true,
            data: { synced: permissionRecords.length },
        });
    } catch {
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
    const allPermissions: Permission[] = [];
    for (const perms of permissionStore.values()) {
        allPermissions.push(...perms);
    }
    return NextResponse.json({ success: true, data: allPermissions });
}
