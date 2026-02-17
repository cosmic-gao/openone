import { NextRequest, NextResponse } from 'next/server';
import type { ApiResponse, AppRegistration } from '@openone/types';
import { makeLogger } from '@openone/utils';
import fs from 'fs/promises';
import path from 'path';

const logger = makeLogger('admin-api-app');
const STORAGE_PATH = process.env.APP_STORAGE_PATH || './storage/apps';

// Mock store access - in reality should share state or DB
// We use a JSON file store to persist apps sharing state with ../route.ts

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
 * PUT /api/apps/[appId]
 * 更新APP信息
 */
export async function PUT(
    request: NextRequest,
    context: { params: Promise<{ appId: string }> }
): Promise<NextResponse<ApiResponse<AppRegistration>>> {
    try {
        const { appId } = await context.params;
        const body = await request.json();

        // Load apps (Need to migrate api/apps/route.ts to use this file store too)
        // For now, let's assume we implement the file store.

        let apps = await getApps();
        const index = apps.findIndex(a => a.appId === appId);

        if (index === -1) {
            return NextResponse.json(
                { success: false, error: 'APP不存在' },
                { status: 404 }
            );
        }

        apps[index] = { ...apps[index], ...body, updatedAt: new Date() };
        await saveApps(apps);

        logger.logInfo('APP信息更新', { appId });

        return NextResponse.json({ success: true, data: apps[index] });

    } catch (err) {
        logger.logError('更新APP失败', err);
        return NextResponse.json(
            { success: false, error: '更新APP失败' },
            { status: 500 }
        );
    }
}

/**
 * DELETE /api/apps/[appId]
 * 删除APP
 */
export async function DELETE(
    request: NextRequest,
    context: { params: Promise<{ appId: string }> }
): Promise<NextResponse<ApiResponse<{ deleted: boolean }>>> {
    try {
        const { appId } = await context.params;

        let apps = await getApps();
        apps = apps.filter(a => a.appId !== appId);
        await saveApps(apps);

        // Also delete storage
        const appDir = path.join(STORAGE_PATH, appId);
        await fs.rm(appDir, { recursive: true, force: true });

        logger.logInfo('APP删除', { appId });

        return NextResponse.json({ success: true, data: { deleted: true } });

    } catch (err) {
        logger.logError('删除APP失败', err);
        return NextResponse.json(
            { success: false, error: '删除APP失败' },
            { status: 500 }
        );
    }
}
