import { index, pgTable, text, timestamp } from "drizzle-orm/pg-core"

export const permission = pgTable(
  "permission",
  {
    code: text("code").primaryKey(),
    applicationKey: text("application_key").notNull(),
    name: text("name").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "string" }).notNull().defaultNow(),
  },
  (table) => {
    return {
      applicationIndex: index("permission_application_key_index").on(table.applicationKey),
    }
  }
)
