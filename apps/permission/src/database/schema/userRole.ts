import { index, pgTable, primaryKey, text, timestamp } from "drizzle-orm/pg-core"

export const userRole = pgTable(
  "user_role",
  {
    userId: text("user_id").notNull(),
    roleId: text("role_id").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "string" }).notNull().defaultNow(),
  },
  (table) => {
    return {
      primaryKey: primaryKey({ columns: [table.userId, table.roleId] }),
      userIndex: index("user_role_user_id_index").on(table.userId),
      roleIndex: index("user_role_role_id_index").on(table.roleId),
    }
  }
)
