import { index, integer, pgTable, text, timestamp } from "drizzle-orm/pg-core"

export const permissionVersion = pgTable(
  "permission_version",
  {
    id: text("id").primaryKey(),
    applicationKey: text("application_key").notNull(),
    number: integer("number").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "string" }).notNull().defaultNow(),
  },
  (table) => {
    return {
      applicationIndex: index("permission_version_application_key_index").on(table.applicationKey),
    }
  }
)

