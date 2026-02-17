import { NextRequest, NextResponse } from 'next/server';
import type { ApiResponse, SchemaSyncRequest, SchemaSyncResult, SchemaInfo } from '@openone/types';
import { dbClient, addSchema, runSql } from '@openone/database';
import { createLogger } from '@openone/utils';
import { eq } from 'drizzle-orm';
import { schemaRegistry, migrationHistory } from '../../../../db/schema';

const logger = createLogger('db-manager');
const DB_URL = process.env.DATABASE_URL || 'postgresql://openone:openone_dev@localhost:5432/openone';

/**
 * 获取数据库客户端
 */
function getDb() {
    return dbClient(DB_URL);
}

/**
 * POST /api/schemas/sync
 * 同步APP的数据库Schema
 */
export async function POST(
    request: NextRequest
): Promise<NextResponse<ApiResponse<SchemaSyncResult>>> {
    try {
        const body: SchemaSyncRequest = await request.json();
        const { appId, appName, schemaName, migrations } = body;

        if (!appId || !schemaName) {
            return NextResponse.json(
                { success: false, error: 'appId和schemaName不能为空' },
                { status: 400 }
            );
        }

        const db = getDb();
        logger.info('开始同步Schema', { appId, schemaName });

        // 1. Check registry
        const existing = await db
            .select()
            .from(schemaRegistry)
            .where(eq(schemaRegistry.appId, appId))
            .limit(1);

        if (existing.length > 0) {
            await db
                .update(schemaRegistry)
                .set({ status: 'migrating', updatedAt: new Date() })
                .where(eq(schemaRegistry.appId, appId));
        } else {
            await db.insert(schemaRegistry).values({
                appId,
                schemaName,
                status: 'creating',
            });
        }

        // 2. Create Schema
        try {
            await addSchema(DB_URL, schemaName);
            logger.info('PG Schema创建完成', { schemaName });
        } catch (err) {
            logger.error('PG Schema创建失败', err);
            await db
                .update(schemaRegistry)
                .set({ status: 'archived', updatedAt: new Date() })
                .where(eq(schemaRegistry.appId, appId));
            return NextResponse.json({
                success: true,
                data: { schemaName, status: 'failed', error: 'PG Schema创建失败' },
            });
        }

        // 3. Run Migrations
        if (migrations?.length) {
            const hasRun = await db
                .select({ filename: migrationHistory.filename })
                .from(migrationHistory)
                .where(eq(migrationHistory.appId, appId));

            const runSet = new Set(hasRun.map((m) => m.filename));

            for (const item of migrations) {
                if (runSet.has(item.filename)) {
                    continue;
                }

                try {
                    await runSql(DB_URL, schemaName, item.content);
                    await db.insert(migrationHistory).values({
                        appId,
                        filename: item.filename,
                        success: true,
                    });
                    logger.info('迁移成功', { filename: item.filename });
                } catch (err) {
                    const msg = err instanceof Error ? err.message : String(err);
                    await db.insert(migrationHistory).values({
                        appId,
                        filename: item.filename,
                        success: false,
                        error: msg,
                    });
                    logger.error('迁移失败', { filename: item.filename, error: err });
                }
            }
        }

        // 4. Update status
        await db
            .update(schemaRegistry)
            .set({ status: 'active', updatedAt: new Date() })
            .where(eq(schemaRegistry.appId, appId));

        return NextResponse.json({
            success: true,
            data: { schemaName, status: 'success' },
        });
    } catch (err) {
        logger.error('Schema同步失败', err);
        return NextResponse.json(
            { success: false, error: 'Schema同步处理失败' },
            { status: 500 }
        );
    }
}

/**
 * GET /api/schemas/sync
 */
export async function GET(): Promise<NextResponse<ApiResponse<SchemaInfo[]>>> {
    try {
        const db = getDb();
        const list = await db.select().from(schemaRegistry);

        const result: SchemaInfo[] = list.map((s) => ({
            id: s.id,
            appId: s.appId,
            schemaName: s.schemaName,
            status: s.status as SchemaInfo['status'],
            createdAt: s.createdAt,
            updatedAt: s.updatedAt,
        }));

        return NextResponse.json({ success: true, data: result });
    } catch (err) {
        logger.error('查询Schema列表失败', err);
        return NextResponse.json(
            { success: false, error: '查询失败' },
            { status: 500 }
        );
    }
}
