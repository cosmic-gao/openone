import fs from "node:fs/promises"
import path from "node:path"
import { fileURLToPath } from "node:url"

import { schemaInit, schemaName } from "@openone/database"

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

async function main() {
  const url = process.env.DATABASE_URL
  if (!url) {
    throw new Error("DATABASE_URL is required.")
  }

  const pkgPath = path.join(__dirname, "..", "package.json")
  const pkg = JSON.parse(await fs.readFile(pkgPath, "utf8"))
  const appId = pkg?.openone?.appId
  const packageName = pkg?.name
  if (!appId || !packageName) {
    throw new Error("openone.appId and package.json name are required.")
  }

  const name = schemaName({ appId, packageName })
  await schemaInit({ url, name })
}

await main()
