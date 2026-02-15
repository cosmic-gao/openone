import { pgSchema, text, serial, timestamp, boolean } from 'drizzle-orm/pg-core';

/** Database APP 使用 platform PG Schema */
export const platformSchema = pgSchema('platform');

/** Schema注册表（持久化存储已注册的APP Schema信息） */
export const schemaRegistry = platformSchema.table('schema_registry', {
    id: serial('id').primaryKey(),
    appId: text('app_id').notNull().unique(),
    schemaName: text('schema_name').notNull().unique(),
    status: text('status').notNull().default('creating'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

/** 迁移历史表（记录每次迁移执行情况） */
export const migrationHistory = platformSchema.table('migration_history', {
    id: serial('id').primaryKey(),
    appId: text('app_id').notNull(),
    filename: text('filename').notNull(),
    executedAt: timestamp('executed_at').defaultNow().notNull(),
    success: boolean('success').notNull().default(true),
    error: text('error'),
});
