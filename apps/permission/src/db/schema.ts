import { pgSchema, text, timestamp, uuid, primaryKey } from 'drizzle-orm/pg-core';

/** Permission APP 专属 PG Schema */
const schemaName = process.env.SCHEMA_NAME || 'permission';
export const permissionSchema = pgSchema(schemaName);

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
    code: text('code').notNull().unique(),
    name: text('name').notNull(),
    description: text('description'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
});

/** 角色-权限关联表 */
export const rolePermissions = permissionSchema.table('role_permissions', {
    roleId: uuid('role_id').references(() => roles.id, { onDelete: 'cascade' }).notNull(),
    permissionId: uuid('permission_id').references(() => permissions.id, { onDelete: 'cascade' }).notNull(),
}, (t) => [
    primaryKey({ columns: [t.roleId, t.permissionId] }),
]);

/** 用户-角色关联表 */
export const userRoles = permissionSchema.table('user_roles', {
    userId: text('user_id').notNull(),
    roleId: uuid('role_id').references(() => roles.id, { onDelete: 'cascade' }).notNull(),
}, (t) => [
    primaryKey({ columns: [t.userId, t.roleId] }),
]);
