import { NextRequest, NextResponse } from 'next/server';
import type { ApiResponse } from '@openone/types';
import { makeLogger } from '@openone/utils';

const logger = makeLogger('perm-env');
const PERMISSION_APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3003';

/**
 * GET /api/env/permission?appId=xxx
 * 返回指定APP的权限相关环境变量
 * 由 Admin APP 在分配环境变量时调用
 * @returns 权限配置键值对
 */
export async function GET(
    request: NextRequest
): Promise<NextResponse<ApiResponse<Record<string, string>>>> {
    try {
        const { searchParams } = new URL(request.url);
        const appId = searchParams.get('appId');

        if (!appId) {
            return NextResponse.json(
                { success: false, error: '缺少必填参数 appId' },
                { status: 400 }
            );
        }

        logger.logInfo('返回APP权限配置', { appId });

        // 返回该APP需要的权限相关环境变量
        const permissionVars: Record<string, string> = {
            PERMISSION_APP_URL: PERMISSION_APP_URL,
        };

        return NextResponse.json({
            success: true,
            data: permissionVars,
        });
    } catch (err) {
        logger.logError('获取权限配置失败', err);
        return NextResponse.json(
            { success: false, error: '获取权限配置失败' },
            { status: 500 }
        );
    }
}
