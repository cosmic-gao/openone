import { defineConfig } from "drizzle-kit"
import { buildPgSchemaName } from "@openone/database"

import packageJson from "./package.json"

export default defineConfig({
  dialect: "postgresql",
  schema: "./src/database/schema/index.ts",
  out: "./src/database/migration",
  dbCredentials: {
    url: (() => {
      const appId = packageJson.openone?.appId
      if (!appId) {
        throw new Error("openone.appId is required.")
      }
      const schema = buildPgSchemaName({ appId, packageName: packageJson.name })
      const url = new URL(process.env.DATABASE_URL!)
      const existing = url.searchParams.get("options") || ""
      if (!existing.includes("search_path=")) {
        url.searchParams.set("options", `${existing} -c search_path=${schema},public`.trim())
      }
      return url.toString()
    })(),
  },
})
