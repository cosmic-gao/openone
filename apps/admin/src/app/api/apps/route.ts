import { NextRequest, NextResponse } from 'next/server';
import type { ApiResponse, AppRegistration } from '@openone/types';

/**
 * 临时内存存储（后续替换为数据库）
 * 用于开发阶段快速验证流程
 */
const appsStore: AppRegistration[] = [];

/**
 * GET /api/apps
 * 获取所有已注册的APP列表
 */
export async function GET(): Promise<NextResponse<ApiResponse<AppRegistration[]>>> {
    return NextResponse.json({ success: true, data: appsStore });
}

/**
 * POST /api/apps
 * 注册新的APP（由上传流程调用）
 */
export async function POST(
    request: NextRequest
): Promise<NextResponse<ApiResponse<AppRegistration>>> {
    try {
        const body = await request.json();
        const { appId, appName, description, menuConfig, latestVersion, url } = body;

        if (!appId || !appName) {
            return NextResponse.json(
                { success: false, error: 'appId和appName不能为空' },
                { status: 400 }
            );
        }

        // 检查是否已存在
        const existingIndex = appsStore.findIndex((a) => a.appId === appId);

        const app: AppRegistration = {
            id: existingIndex >= 0 ? appsStore[existingIndex]!.id : appsStore.length + 1,
            appId,
            appName,
            description: description || '',
            status: 'published',
            latestVersion: latestVersion || '1.0.0',
            menuConfig: menuConfig || [],
            url: url || '',
            createdAt: existingIndex >= 0 ? appsStore[existingIndex]!.createdAt : new Date(),
            updatedAt: new Date(),
        };

        if (existingIndex >= 0) {
            appsStore[existingIndex] = app;
        } else {
            appsStore.push(app);
        }

        return NextResponse.json({ success: true, data: app });
    } catch {
        return NextResponse.json(
            { success: false, error: '服务器内部错误' },
            { status: 500 }
        );
    }
}
