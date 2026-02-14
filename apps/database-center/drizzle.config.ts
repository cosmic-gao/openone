import type { Config } from "drizzle-kit"

export default {
  dialect: "postgresql",
  schema: "./src/database/schema/*.ts",
  out: "./src/database/migration",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
} satisfies Config

