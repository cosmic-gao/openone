import { NextRequest, NextResponse } from 'next/server';
import type { ApiResponse } from '@openone/types';
import { makeLogger, readFile, makeFile, groupVars } from '@openone/utils';
import fs from 'fs/promises';
import path from 'path';

const logger = makeLogger('admin-api-env');
const STORAGE_PATH = process.env.APP_STORAGE_PATH || './storage/apps';

// Mock apps store access (should be replaced by DB)
// In a real app we would import the shared store or query DB
// For now we assume we can read/write to filesystem which is the source of truth for ENV

/**
 * GET /api/apps/[appId]/env
 * 获取指定APP的环境变量
 */
export async function GET(
    request: NextRequest,
    context: { params: Promise<{ appId: string }> }
): Promise<NextResponse<ApiResponse<Record<string, string>>>> {
    try {
        const { appId } = await context.params;

        // Find latest version or active version
        // Simplified: assume we just look for the first folder in app dir or allow version in query
        const appDir = path.join(STORAGE_PATH, appId);

        try {
            await fs.access(appDir);
        } catch {
            return NextResponse.json(
                { success: false, error: 'APP不存在' },
                { status: 404 }
            );
        }

        // Get versions
        const versions = await fs.readdir(appDir);
        if (versions.length === 0) {
            return NextResponse.json(
                { success: false, error: 'APP未部署任何版本' },
                { status: 404 }
            );
        }

        // Use latest version (simple sort)
        const latestVersion = versions.sort().pop()!;
        const envPath = path.join(appDir, latestVersion, '.env');

        try {
            const content = await fs.readFile(envPath, 'utf-8');
            const envStart = readFile(content);
            return NextResponse.json({ success: true, data: envStart });
        } catch (e) {
            // No .env found
            return NextResponse.json({ success: true, data: {} });
        }

    } catch (err) {
        logger.logError('获取环境变量失败', err);
        return NextResponse.json(
            { success: false, error: '获取环境变量失败' },
            { status: 500 }
        );
    }
}

/**
 * POST /api/apps/[appId]/env
 * 更新指定APP的环境变量
 */
export async function POST(
    request: NextRequest,
    context: { params: Promise<{ appId: string }> }
): Promise<NextResponse<ApiResponse<{ success: boolean }>>> {
    try {
        const { appId } = await context.params;
        const body = await request.json(); // Record<string, string>

        const appDir = path.join(STORAGE_PATH, appId);
        const versions = await fs.readdir(appDir);
        if (versions.length === 0) {
            return NextResponse.json(
                { success: false, error: 'APP未部署' },
                { status: 404 }
            );
        }
        const latestVersion = versions.sort().pop()!;
        const envPath = path.join(appDir, latestVersion, '.env');

        // Read existing to allow merging or just overwrite?
        // User interface sends full list, so currently we treat it as "State of Custom Vars"
        // BUT, system vars (PORT, etc) should be preserved or re-generated.
        // Best approach: Read existing, update CUSTOM vars / overrides, re-generate file.

        let existingEnv: Record<string, string> = {};
        try {
            const content = await fs.readFile(envPath, 'utf-8');
            existingEnv = readFile(content);
        } catch { }

        // Separate System vs Custom in existing
        const grouped = groupVars(existingEnv);

        // The body contains ALL vars from UI.
        // We should identify which are "custom" (edited by user) vs "system".
        // The UI separates them visually but sends all.
        // Actually, for safety, we should probaby ONLY allow updating "appVars" (custom) 
        // OR allow overriding system vars if really needed.
        // Let's assume the body represents the DESIRED state of all variables.

        // Re-group based on input
        const newGrouped = groupVars(body);

        // Preserve Critical System Vars if missing? 
        // For now, trust the UI sent back everything including system vars (as read-only).
        // If UI sends system vars, we just write them back.

        // Construct file content
        // We can use `joinEnv` to reconstruct formatted .env
        // But `makeFile` provides better structure. 
        // Since we don't have the original `AppConfig` object here easily, 
        // using `joinEnv` (if available / exported) or manually constructing is better.
        // Wait, `joinEnv` IS exported from `@openone/utils`.

        // Let's use a simpler approach: Reconstruct using `joinEnv` from utils.
        const { joinEnv } = require('@openone/utils'); // dynamic import or standard import

        // Need to import joinEnv properly at top

        // Note: joinEnv logic:
        // adminVars -> PORT, URLs
        // databaseVars -> DATABASE_URL
        // permissionVars -> ...
        // appVars -> others

        const content = joinEnv(newGrouped);

        await fs.writeFile(envPath, content, 'utf-8');

        logger.logInfo('更新环境变量', { appId, version: latestVersion });

        return NextResponse.json({ success: true, data: { success: true } });

    } catch (err) {
        logger.logError('更新环境变量失败', err);
        return NextResponse.json(
            { success: false, error: '更新环境变量失败' },
            { status: 500 }
        );
    }
}
