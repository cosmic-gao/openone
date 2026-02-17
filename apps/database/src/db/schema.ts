import { pgSchema, text, serial, timestamp, boolean, uuid } from 'drizzle-orm/pg-core';

/** Database APP 使用 platform PG Schema */
const schemaName = process.env.SCHEMA_NAME || 'db_manager';
export const platformSchema = pgSchema(schemaName);

/** Schema注册表（持久化存储已注册的APP Schema信息） */
export const schemaRegistry = platformSchema.table('schema_registry', {
    id: uuid('id').primaryKey().defaultRandom(),
    app: text('app_id').notNull().unique(),
    name: text('schema_name').notNull().unique(),
    status: text('status').notNull().default('creating'),
    remark: text('remark'),
    createdBy: text('created_by'),
    updatedBy: text('updated_by'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

/** 迁移历史表（记录每次迁移执行情况） */
export const migrationHistory = platformSchema.table('migration_history', {
    id: uuid('id').primaryKey().defaultRandom(),
    app: text('app_id').notNull(),
    filename: text('filename').notNull(),
    executed: timestamp('executed_at').defaultNow().notNull(),
    success: boolean('success').notNull().default(true),
    error: text('error'),
    createdBy: text('created_by'),
    updatedBy: text('updated_by'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
});
