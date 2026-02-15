import { NextRequest, NextResponse } from 'next/server';
import type { ApiResponse, PermissionCheckRequest, PermissionCheckResponse } from '@openone/types';

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

        // TODO: 从数据库查询用户角色→角色权限→匹配权限Code
        // 当前开发阶段默认全部放行
        return NextResponse.json({
            success: true,
            data: { hasPermission: true },
        });
    } catch {
        return NextResponse.json(
            { success: false, error: '权限校验失败' },
            { status: 500 }
        );
    }
}
