import fs from "node:fs/promises"
import path from "node:path"
import { fileURLToPath } from "node:url"

import { buildPgSchemaName, ensureSchemaExists } from "@openone/database"

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

function parseArgs(argv) {
  const dryRun = argv.includes("--dry-run") || argv.includes("-n")
  return { dryRun }
}

async function readJson(filePath) {
  const content = await fs.readFile(filePath, "utf8")
  return JSON.parse(content)
}

async function listApps(rootDir) {
  const appsDir = path.join(rootDir, "apps")
  const entries = await fs.readdir(appsDir, { withFileTypes: true })
  return entries.filter((e) => e.isDirectory()).map((e) => path.join(appsDir, e.name))
}

async function main() {
  const { dryRun } = parseArgs(process.argv.slice(2))
  const repoRoot = path.resolve(__dirname, "..")
  const url = process.env.DATABASE_URL
  if (!dryRun && !url) {
    throw new Error("DATABASE_URL is required.")
  }

  const apps = await listApps(repoRoot)
  const results = []
  for (const appDir of apps) {
    const packageJsonPath = path.join(appDir, "package.json")
    try {
      const pkg = await readJson(packageJsonPath)
      const appId = pkg?.openone?.appId
      const packageName = pkg?.name
      if (!appId || !packageName) {
        continue
      }

      const schemaName = buildPgSchemaName({ appId, packageName })
      if (dryRun) {
        results.push({ appDir: path.basename(appDir), packageName, appId, schemaName, created: null })
        continue
      }

      const { created } = await ensureSchemaExists({ url, schemaName })
      results.push({ appDir: path.basename(appDir), packageName, appId, schemaName, created })
    } catch {
      continue
    }
  }

  process.stdout.write(JSON.stringify({ dryRun, results }, null, 2) + "\n")
}

await main()
