import { pgSchema, text, timestamp, uuid, primaryKey } from 'drizzle-orm/pg-core';

/** Permission APP 专属 PG Schema */
const schemaName = process.env.SCHEMA_NAME || 'permission';
export const permissionSchema = pgSchema(schemaName);

/** 角色表 */
export const roles = permissionSchema.table('roles', {
    id: uuid('id').primaryKey().defaultRandom(),
    name: text('name').notNull().unique(),
    description: text('description'),
    remark: text('remark'),
    createdBy: text('created_by'),
    updatedBy: text('updated_by'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

/** 权限表 */
export const permissions = permissionSchema.table('permissions', {
    id: uuid('id').primaryKey().defaultRandom(),
    app: text('app_id').notNull(),
    code: text('code').notNull().unique(),
    name: text('name').notNull(),
    description: text('description'),
    remark: text('remark'),
    createdBy: text('created_by'),
    updatedBy: text('updated_by'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

/** 角色-权限关联表 */
export const rolePermissions = permissionSchema.table('role_permissions', {
    role: uuid('role_id').references(() => roles.id, { onDelete: 'cascade' }).notNull(),
    permission: uuid('permission_id').references(() => permissions.id, { onDelete: 'cascade' }).notNull(),
}, (t) => [
    primaryKey({ columns: [t.role, t.permission] }),
]);

/** 用户-角色关联表 */
export const userRoles = permissionSchema.table('user_roles', {
    user: text('user_id').notNull(),
    role: uuid('role_id').references(() => roles.id, { onDelete: 'cascade' }).notNull(),
}, (t) => [
    primaryKey({ columns: [t.user, t.role] }),
]);
