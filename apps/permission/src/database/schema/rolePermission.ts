import { index, pgTable, primaryKey, text, timestamp } from "drizzle-orm/pg-core"

export const rolePermission = pgTable(
  "role_permission",
  {
    roleId: text("role_id").notNull(),
    permissionCode: text("permission_code").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "string" }).notNull().defaultNow(),
  },
  (table) => {
    return {
      primaryKey: primaryKey({ columns: [table.roleId, table.permissionCode] }),
      roleIndex: index("role_permission_role_id_index").on(table.roleId),
      permissionIndex: index("role_permission_permission_code_index").on(table.permissionCode),
    }
  }
)
