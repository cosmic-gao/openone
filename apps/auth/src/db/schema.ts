import { pgSchema, text, timestamp, uuid } from 'drizzle-orm/pg-core';

/** Auth APP 专属 PG Schema */
const schemaName = process.env.SCHEMA_NAME || 'auth';
export const authSchema = pgSchema(schemaName);

/** 用户表 */
export const users = authSchema.table('users', {
    id: uuid('id').primaryKey().defaultRandom(),
    username: text('username').notNull().unique(),
    email: text('email').notNull(),
    password: text('password').notNull(),
    remark: text('remark'),
    createdBy: text('created_by'),
    updatedBy: text('updated_by'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

/** 刷新Token表 */
export const refreshTokens = authSchema.table('refresh_tokens', {
    id: uuid('id').primaryKey().defaultRandom(),
    user: uuid('user_id').references(() => users.id).notNull(),
    token: text('token').notNull().unique(),
    expire: timestamp('expire_at').notNull(),
    createdBy: text('created_by'),
    updatedBy: text('updated_by'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
});
