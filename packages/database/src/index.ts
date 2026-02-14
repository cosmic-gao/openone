import postgres from "postgres"
import { drizzle } from "drizzle-orm/postgres-js"

export type DatabaseClient = ReturnType<typeof drizzle>

export type DatabaseOptions = Readonly<{
  databaseUrl: string
  applicationName: string
  pgSchema?: string
}>

/**
 * 创建基于 postgres-js 的 Drizzle 数据库客户端。
 *
 * @param options 数据库连接参数。
 * @returns Drizzle 数据库客户端实例。
 * @throws Error databaseUrl 为空或连接失败时抛出。
 * @example
 * const database = createDatabase({ databaseUrl: process.env.DATABASE_URL!, applicationName: "permission" })
 */
export function createDatabase(options: DatabaseOptions): DatabaseClient {
  if (!options.databaseUrl) {
    throw new Error("Database URL is required.")
  }

  const url = new URL(options.databaseUrl)
  if (!url.searchParams.get("application_name")) {
    url.searchParams.set("application_name", options.applicationName)
  }
  if (options.pgSchema) {
    const schema = toPgSchemaIdentifier(options.pgSchema)
    if (schema) {
      const existing = url.searchParams.get("options") || ""
      if (!existing.includes("search_path=")) {
        const next = `${existing} -c search_path=${schema},public`.trim()
        url.searchParams.set("options", next)
      }
    }
  }

  const sql = postgres(url.toString(), {
    max: 10,
    idle_timeout: 20,
    connect_timeout: 10,
  })

  return drizzle(sql)
}

export function toDatabaseIdentifier(input: string) {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 63)
}

export function toPgSchemaIdentifier(input: string) {
  const normalized = toDatabaseIdentifier(input)
  if (!normalized) {
    return ""
  }
  if (/^[a-z_]/.test(normalized)) {
    return normalized
  }
  return `s_${normalized}`.slice(0, 63)
}

export function buildDatabaseName(options: Readonly<{ appId: string; packageName: string; prefix?: string }>) {
  const prefix = toDatabaseIdentifier(options.prefix || "openone")
  const appId = toDatabaseIdentifier(options.appId)
  const packageName = toDatabaseIdentifier(options.packageName)
  const candidate = [prefix, appId, packageName].filter(Boolean).join("_")
  return candidate.length <= 63 ? candidate : candidate.slice(0, 63)
}

export function buildPgSchemaName(options: Readonly<{ appId: string; packageName: string; prefix?: string }>) {
  const prefix = toPgSchemaIdentifier(options.prefix || "openone")
  const appId = toPgSchemaIdentifier(options.appId)
  const packageName = toPgSchemaIdentifier(options.packageName)
  const candidate = [prefix, appId, packageName].filter(Boolean).join("_")
  return candidate.length <= 63 ? candidate : candidate.slice(0, 63)
}

export async function ensureDatabaseExists(options: Readonly<{ adminUrl: string; databaseName: string }>) {
  const name = toDatabaseIdentifier(options.databaseName)
  if (!name) {
    throw new Error("Database name is required.")
  }

  const url = new URL(options.adminUrl)
  if (!url.pathname || url.pathname === "/") {
    url.pathname = "/postgres"
  }

  const sql = postgres(url.toString(), { max: 1, connect_timeout: 10 })
  try {
    const existing = await sql<{ exists: boolean }[]>`
      select exists(select 1 from pg_database where datname = ${name}) as "exists"
    `
    if (existing[0]?.exists) {
      return { created: false, databaseName: name }
    }

    await sql.unsafe(`create database "${name}"`)
    return { created: true, databaseName: name }
  } finally {
    await sql.end({ timeout: 5 })
  }
}

export async function ensureSchemaExists(options: Readonly<{ url: string; schemaName: string }>) {
  const schemaName = toPgSchemaIdentifier(options.schemaName)
  if (!schemaName) {
    throw new Error("Schema name is required.")
  }

  const sql = postgres(options.url, { max: 1, connect_timeout: 10 })
  try {
    await sql.unsafe(`create schema if not exists "${schemaName}"`)
    return { created: true, schemaName }
  } finally {
    await sql.end({ timeout: 5 })
  }
}
