import { pgSchema, text, timestamp, uuid } from 'drizzle-orm/pg-core';

/** Permission APP 专属 PG Schema */
export const permissionSchema = pgSchema('GJgUM0k-UkbS6v0L87Fio_permission');

/** 角色表 */
export const roles = permissionSchema.table('roles', {
    id: uuid('id').primaryKey().defaultRandom(),
    name: text('name').notNull().unique(),
    description: text('description'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
});

/** 权限表 */
export const permissions = permissionSchema.table('permissions', {
    id: uuid('id').primaryKey().defaultRandom(),
    appId: text('app_id').notNull(),
    code: text('code').notNull(),
    name: text('name').notNull(),
    description: text('description'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
});

/** 角色-权限关联表 */
export const rolePermissions = permissionSchema.table('role_permissions', {
    roleId: uuid('role_id').references(() => roles.id).notNull(),
    permissionId: uuid('permission_id').references(() => permissions.id).notNull(),
});
