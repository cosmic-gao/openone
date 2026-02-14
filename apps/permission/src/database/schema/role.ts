import { index, pgTable, text, timestamp } from "drizzle-orm/pg-core"

export const role = pgTable(
  "role",
  {
    id: text("id").primaryKey(),
    applicationKey: text("application_key").notNull(),
    name: text("name").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "string" }).notNull().defaultNow(),
  },
  (table) => {
    return {
      applicationIndex: index("role_application_key_index").on(table.applicationKey),
    }
  }
)
