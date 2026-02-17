import { NextRequest, NextResponse } from 'next/server';
import type {
    ApiResponse,
    EnvAssignRequest,
    EnvAssignResponse,
    EnvAssignment,
    AppEnvConfig,
} from '@openone/types';
import {
    makeLogger,
    calcPort,
    calcUrl,
    makeFile,
    getSchema,
} from '@openone/utils';

const PORT_RANGE_START = parseInt(process.env.APP_PORT_RANGE_START || '4000', 10);
const PORT_RANGE_END = parseInt(process.env.APP_PORT_RANGE_END || '4999', 10);

const DB_MANAGER_APP_URL = process.env.DB_MANAGER_APP_URL || 'http://localhost:3004';
const PERMISSION_APP_URL = process.env.PERMISSION_APP_URL || 'http://localhost:3003';
const ADMIN_APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3002';

const logger = makeLogger('admin-env');

/**
 * POST /api/env/assign
 * 为APP分配端口、域名，并从 Database/Permission APP 聚合环境变量
 * @param request - 包含 appId、appName、schemaName 等信息
 * @returns 分配结果，包含分类后的环境变量和完整 .env 内容
 */
export async function POST(
    request: NextRequest
): Promise<NextResponse<ApiResponse<EnvAssignResponse>>> {
    try {
        const body: EnvAssignRequest = await request.json();
        const { appId, appName, schemaName, customEnv } = body;

        if (!appId || !appName) {
            return NextResponse.json(
                { success: false, error: '缺少必填参数 appId 或 appName' },
                { status: 400 }
            );
        }

        logger.logInfo('开始为APP分配环境变量', { appId, appName });

        // 1. 分配端口和URL（Admin职责）
        const port = calcPort(appId, PORT_RANGE_START, PORT_RANGE_END);
        const url = calcUrl(appId, 'localhost', port);

        const adminVars: Record<string, string> = {
            PORT: String(port),
            NEXT_PUBLIC_APP_URL: url,
            ADMIN_APP_URL: ADMIN_APP_URL,
        };

        // 2. 从 Database APP 获取数据库配置
        let databaseVars: Record<string, string> = {};
        const resolvedSchema = schemaName ? getSchema(appId, schemaName) : '';
        if (resolvedSchema) {
            try {
                const dbRes = await fetch(
                    `${DB_MANAGER_APP_URL}/api/env/database?appId=${appId}&schemaName=${resolvedSchema}`
                );
                if (dbRes.ok) {
                    const dbData = await dbRes.json();
                    databaseVars = dbData.data || {};
                    logger.logInfo('从Database APP获取配置成功', { appId });
                }
            } catch (err) {
                logger.logWarn('从Database APP获取配置失败（可能未启动）', err);
                // 回退：无法获取配置
                databaseVars = {
                    DATABASE_URL: '',
                    SCHEMA_NAME: resolvedSchema,
                };
            }
        }

        // 3. 从 Permission APP 获取权限配置
        let permissionVars: Record<string, string> = {};
        try {
            const permRes = await fetch(
                `${PERMISSION_APP_URL}/api/env/permission?appId=${appId}`
            );
            if (permRes.ok) {
                const permData = await permRes.json();
                permissionVars = permData.data || {};
                logger.logInfo('从Permission APP获取配置成功', { appId });
            }
        } catch (err) {
            logger.logWarn('从Permission APP获取配置失败（可能未启动）', err);
            permissionVars = {
                PERMISSION_APP_URL: PERMISSION_APP_URL,
            };
        }

        // 4. 合并所有环境变量
        const assignment: EnvAssignment = {
            adminVars,
            databaseVars,
            permissionVars,
            appVars: customEnv || {},
        };

        // 5. 生成完整 .env 配置
        const envConfig: AppEnvConfig = {
            appId,
            port,
            url,
            databaseUrl: databaseVars.DATABASE_URL || '',
            schemaName: resolvedSchema,
            permissionServiceUrl: PERMISSION_APP_URL,
            databaseServiceUrl: DB_MANAGER_APP_URL,
            adminServiceUrl: ADMIN_APP_URL,
            custom: customEnv || {},
        };
        const envFileContent = makeFile(envConfig);

        logger.logInfo('APP环境变量分配完成', { appId, port, url });

        return NextResponse.json({
            success: true,
            data: { port, url, assignment, envFileContent },
        });
    } catch (err) {
        logger.logError('环境变量分配失败', err);
        return NextResponse.json(
            { success: false, error: '环境变量分配失败' },
            { status: 500 }
        );
    }
}
