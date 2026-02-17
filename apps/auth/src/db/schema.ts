import { pgSchema, text, timestamp, uuid } from 'drizzle-orm/pg-core';

/** Auth APP 专属 PG Schema */
export const authSchema = pgSchema('VSnESG0K3DILCmacEzeab_auth');

/** 用户表 */
export const users = authSchema.table('users', {
    id: uuid('id').primaryKey().defaultRandom(),
    username: text('username').notNull().unique(),
    passwordHash: text('password_hash').notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

/** 刷新Token表 */
export const refreshTokens = authSchema.table('refresh_tokens', {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id').references(() => users.id).notNull(),
    token: text('token').notNull().unique(),
    expiresAt: timestamp('expires_at').notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
});
