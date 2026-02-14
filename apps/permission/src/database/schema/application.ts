import { pgTable, text, timestamp } from "drizzle-orm/pg-core"

export const application = pgTable("application", {
  key: text("key").primaryKey(),
  name: text("name").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "string" }).notNull().defaultNow(),
})
