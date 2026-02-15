import { NextRequest, NextResponse } from 'next/server';
import type { ApiResponse, SchemaSyncRequest, SchemaSyncResult, SchemaInfo } from '@openone/types';
import { createClient, createSchema, executeInSchema } from '@openone/db';
import { createLogger } from '@openone/utils';
import { eq } from 'drizzle-orm';
import { schemaRegistry, migrationHistory } from '../../../../db/schema';

const logger = createLogger('db-manager-app');
const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://openone:openone_dev@localhost:5432/openone';

/**
 * 获取数据库客户端（单例）
 */
function getDb() {
    return createClient(DATABASE_URL);
}

/**
 * POST /api/schemas/sync
 * 同步APP的数据库Schema
 * 创建PG Schema + 执行迁移文件 + 持久化注册信息
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

        // 1. 查询或创建注册记录
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

        // 2. 创建PG Schema
        try {
            await createSchema(DATABASE_URL, schemaName);
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

        // 3. 执行迁移文件（跳过已执行的迁移）
        if (migrations?.length) {
            const executedMigrations = await db
                .select({ filename: migrationHistory.filename })
                .from(migrationHistory)
                .where(eq(migrationHistory.appId, appId));

            const executedSet = new Set(executedMigrations.map((m) => m.filename));

            for (const migration of migrations) {
                if (executedSet.has(migration.filename)) {
                    logger.info('跳过已执行的迁移', { filename: migration.filename });
                    continue;
                }

                try {
                    await executeInSchema(DATABASE_URL, schemaName, migration.content);
                    await db.insert(migrationHistory).values({
                        appId,
                        filename: migration.filename,
                        success: true,
                    });
                    logger.info('迁移执行成功', { filename: migration.filename });
                } catch (err) {
                    const errorMsg = err instanceof Error ? err.message : String(err);
                    await db.insert(migrationHistory).values({
                        appId,
                        filename: migration.filename,
                        success: false,
                        error: errorMsg,
                    });
                    logger.error('迁移执行失败', { filename: migration.filename, error: err });
                }
            }
        }

        // 4. 更新状态为active
        await db
            .update(schemaRegistry)
            .set({ status: 'active', updatedAt: new Date() })
            .where(eq(schemaRegistry.appId, appId));

        logger.info('Schema同步完成', { appId, schemaName });

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
 * 获取所有已注册Schema列表（从数据库查询）
 */
export async function GET(): Promise<NextResponse<ApiResponse<SchemaInfo[]>>> {
    try {
        const db = getDb();
        const schemas = await db.select().from(schemaRegistry);

        const result: SchemaInfo[] = schemas.map((s) => ({
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

