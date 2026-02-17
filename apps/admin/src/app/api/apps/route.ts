import { NextRequest, NextResponse } from 'next/server';
import type { ApiResponse, AppRegistration } from '@openone/types';
import fs from 'fs/promises';
import path from 'path';

// Shared persistence (Same logic as [appId]/route.ts)
const STORE_FILE = path.join(process.cwd(), 'data', 'apps.json');

async function getApps(): Promise<AppRegistration[]> {
    try {
        const data = await fs.readFile(STORE_FILE, 'utf-8');
        return JSON.parse(data);
    } catch {
        return [];
    }
}

async function saveApps(apps: AppRegistration[]) {
    await fs.mkdir(path.dirname(STORE_FILE), { recursive: true });
    await fs.writeFile(STORE_FILE, JSON.stringify(apps, null, 2));
}

/**
 * GET /api/apps
 * 获取所有已注册的APP列表
 */
export async function GET(): Promise<NextResponse<ApiResponse<AppRegistration[]>>> {
    const apps = await getApps();
    return NextResponse.json({ success: true, data: apps });
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

        const apps = await getApps();
        const existingIndex = apps.findIndex((a) => a.appId === appId);

        const app: AppRegistration = {
            id: existingIndex >= 0 ? apps[existingIndex]!.id : Date.now(), // Use timestamp number for ID if new
            appId,
            appName,
            description: description || '',
            status: 'published',
            latestVersion: latestVersion || '1.0.0',
            menuConfig: menuConfig || [],
            url: url || '',
            createdAt: existingIndex >= 0 ? apps[existingIndex]!.createdAt : new Date(),
            updatedAt: new Date(),
        };

        if (existingIndex >= 0) {
            apps[existingIndex] = app;
        } else {
            apps.push(app);
        }

        await saveApps(apps);

        return NextResponse.json({ success: true, data: app });
    } catch {
        return NextResponse.json(
            { success: false, error: '服务器内部错误' },
            { status: 500 }
        );
    }
}
