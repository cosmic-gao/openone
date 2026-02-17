import { NextRequest, NextResponse } from 'next/server';
import type { ApiResponse } from '@openone/types';
import { createLogger } from '@openone/utils';

const logger = createLogger('db-env');
const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://postgres:123456@localhost:5432/openone';

/**
 * GET /api/env/database?appId=xxx&schemaName=xxx
 * 返回指定APP的数据库相关环境变量
 * 由 Admin APP 在分配环境变量时调用
 * @returns 数据库配置键值对
 */
export async function GET(
    request: NextRequest
): Promise<NextResponse<ApiResponse<Record<string, string>>>> {
    try {
        const { searchParams } = new URL(request.url);
        const appId = searchParams.get('appId');
        const schemaName = searchParams.get('schemaName');

        if (!appId) {
            return NextResponse.json(
                { success: false, error: '缺少必填参数 appId' },
                { status: 400 }
            );
        }

        const resolvedSchema = schemaName || appId.replace(/-/g, '_');

        logger.info('返回APP数据库配置', { appId, schemaName: resolvedSchema });

        // 返回该APP需要的数据库相关环境变量
        const databaseVars: Record<string, string> = {
            DATABASE_URL: DATABASE_URL,
            SCHEMA_NAME: resolvedSchema,
        };

        return NextResponse.json({
            success: true,
            data: databaseVars,
        });
    } catch (err) {
        logger.error('获取数据库配置失败', err);
        return NextResponse.json(
            { success: false, error: '获取数据库配置失败' },
            { status: 500 }
        );
    }
}
