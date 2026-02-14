import { index, integer, jsonb, pgTable, text, timestamp } from "drizzle-orm/pg-core"

export const schemaVersion = pgTable(
  "schema_version",
  {
    id: text("id").primaryKey(),
    schemaId: text("schema_id").notNull(),
    number: integer("number").notNull(),
    status: text("status").notNull(),
    definition: jsonb("definition").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "string" }).notNull().defaultNow(),
  },
  (table) => {
    return {
      schemaIndex: index("schema_version_schema_id_index").on(table.schemaId),
    }
  }
)
