import { NextRequest, NextResponse } from 'next/server';
import type { ApiResponse, AppConfig } from '@openone/types';
import {
    makeLogger,
    makeFile,
    calcPort,
    calcUrl,
    getSchema,
    withAuth,
} from '@openone/utils';
import fs from 'fs/promises';
import path from 'path';
import AdmZip from 'adm-zip';

const logger = makeLogger('admin-app');
const STORAGE_PATH = process.env.APP_STORAGE_PATH || './storage/apps';
const PERMISSION_APP_URL = process.env.PERMISSION_APP_URL || 'http://localhost:3003';
const DB_MANAGER_APP_URL = process.env.DB_MANAGER_APP_URL || 'http://localhost:3004';
const ADMIN_APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3002';
const PORT_RANGE_START = parseInt(process.env.APP_PORT_RANGE_START || '4000', 10);
const PORT_RANGE_END = parseInt(process.env.APP_PORT_RANGE_END || '4999', 10);

/**
 * POST /api/upload
 * 处理APP ZIP包上传
 * APP的ZIP包中不包含.env（.env仅用于本地开发），发布后由Admin APP统一生成
 * 流程：接收文件 → 解压 → 校验配置 → 生成.env → 同步权限 → 同步Schema → 注册APP
 */
export async function POST(
    request: NextRequest
): Promise<NextResponse<ApiResponse<{ appId: string; version: string }>>> {
    try {
        // 鉴权：需要登录
        const user = withAuth(request);
        if (!user) {
            return NextResponse.json(
                { success: false, error: '未授权访问' },
                { status: 401 }
            );
        }
        // TODO: 进一步检查是否有 admin 权限，例如 user.permissions.includes('app:upload')

        const formData = await request.formData();
        const file = formData.get('file') as File;

        if (!file) {
            return NextResponse.json(
                { success: false, error: '请上传ZIP文件' },
                { status: 400 }
            );
        }

        // 1. 读取ZIP文件
        const buffer = Buffer.from(await file.arrayBuffer());
        const zip = new AdmZip(buffer);

        // 2. 校验openone.config.json是否存在
        const configEntry = zip.getEntry('openone.config.json');
        if (!configEntry) {
            return NextResponse.json(
                { success: false, error: 'ZIP包中缺少 openone.config.json 配置文件' },
                { status: 400 }
            );
        }

        // 3. 解析配置
        const configText = configEntry.getData().toString('utf-8');
        let appConfig: AppConfig;
        try {
            appConfig = JSON.parse(configText);
        } catch {
            return NextResponse.json(
                { success: false, error: 'openone.config.json 格式错误' },
                { status: 400 }
            );
        }

        const { appId, appName, version, permissions, database, menus } = appConfig;
        logger.logInfo('开始处理APP上传', { appId, version, operator: user.username });

        // 4. 解压到存储目录
        const appDir = path.join(STORAGE_PATH, appId, version);
        await fs.mkdir(appDir, { recursive: true });
        zip.extractAllTo(appDir, true);
        logger.logInfo('文件解压完成', { appDir });

        // 5. 生成.env — APP的ZIP包不含.env，由Admin APP在发布时统一生成
        try {
            const port = calcPort(appId, PORT_RANGE_START, PORT_RANGE_END);
            const url = calcUrl(appId, 'localhost', port);

            // 从 Database APP 获取数据库配置
            let databaseUrl = '';
            const schemaName = database?.schemaName
                ? getSchema(appId, database.schemaName)
                : '';
            if (schemaName) {
                try {
                    const dbRes = await fetch(
                        `${DB_MANAGER_APP_URL}/api/env/database?appId=${appId}&schemaName=${schemaName}`
                    );
                    if (dbRes.ok) {
                        const dbData = await dbRes.json();
                        databaseUrl = dbData.data?.DATABASE_URL || '';
                    }
                } catch {
                    logger.logWarn('从Database APP获取配置失败');
                    databaseUrl = '';
                }
            }

            const envContent = makeFile({
                appId,
                port,
                url,
                databaseUrl,
                schemaName,
                permissionServiceUrl: PERMISSION_APP_URL,
                databaseServiceUrl: DB_MANAGER_APP_URL,
                adminServiceUrl: ADMIN_APP_URL,
                custom: {},
            });

            // 将 .env 写入APP部署目录
            await fs.writeFile(path.join(appDir, '.env'), envContent, 'utf-8');
            logger.logInfo('环境变量分发完成', { appId, port, url });
        } catch (err) {
            logger.logWarn('环境变量分发失败', err);
        }

        // 6. 同步权限到permission-app
        if (permissions?.length) {
            try {
                await fetch(`${PERMISSION_APP_URL}/api/permissions/sync`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ appId, appName, permissions }),
                });
                logger.logInfo('权限同步完成', { appId, count: permissions.length });
            } catch (err) {
                logger.logWarn('权限同步失败（permission-app可能未启动）', err);
            }
        }

        // 7. 同步数据库Schema
        if (database?.schemaName) {
            try {
                // 读取迁移文件
                const migrationsDir = path.join(appDir, database.migrations || 'drizzle');
                let migrations: { filename: string; content: string }[] = [];

                try {
                    const files = await fs.readdir(migrationsDir);
                    const sqlFiles = files.filter((f) => f.endsWith('.sql'));
                    migrations = await Promise.all(
                        sqlFiles.map(async (filename) => ({
                            filename,
                            content: await fs.readFile(path.join(migrationsDir, filename), 'utf-8'),
                        }))
                    );
                } catch {
                    logger.logWarn('未找到迁移文件目录', { migrationsDir });
                }

                await fetch(`${DB_MANAGER_APP_URL}/api/schemas/sync`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        appId,
                        appName,
                        schemaName: getSchema(appId, database.schemaName),
                        migrations,
                    }),
                });
                logger.logInfo('Schema同步完成', {
                    appId,
                    schemaName: getSchema(appId, database.schemaName),
                });
            } catch (err) {
                logger.logWarn('Schema同步失败（db-manager-app可能未启动）', err);
            }
        }

        // 8. 注册APP到本地注册表
        try {
            await fetch(`${request.nextUrl.origin}/api/apps`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    appId,
                    appName,
                    description: `${appName} v${version}`,
                    menuConfig: menus,
                    latestVersion: version,
                    url: `${request.nextUrl.origin}/apps/${appId}/${version}`,
                }),
            });
        } catch (err) {
            logger.logError('APP注册失败', err);
        }

        logger.logInfo('APP发布完成', { appId, version });

        return NextResponse.json({
            success: true,
            data: { appId, version },
        });
    } catch (err) {
        logger.logError('APP上传处理失败', err);
        return NextResponse.json(
            { success: false, error: '上传处理失败' },
            { status: 500 }
        );
    }
}
