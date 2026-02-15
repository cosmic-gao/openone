import postgres from "postgres"
import { drizzle } from "drizzle-orm/postgres-js"
import type { Plug } from "@openone/types"

export type DbClient = ReturnType<typeof drizzle>

export type DbOpts = Readonly<{
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
 * const database = db({ databaseUrl: process.env.DATABASE_URL!, applicationName: "permission" })
 */
export function db(options: DbOpts): DbClient {
  if (!options.databaseUrl) {
    throw new Error("Database URL is required.")
  }

  const url = new URL(options.databaseUrl)
  if (!url.searchParams.get("application_name")) {
    url.searchParams.set("application_name", options.applicationName)
  }
  if (options.pgSchema) {
    const schema = schemaId(options.pgSchema)
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

function slug(input: string) {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 63)
}

function schemaId(input: string) {
  const normalized = slug(input)
  if (!normalized) {
    return ""
  }
  if (/^[a-z_]/.test(normalized)) {
    return normalized
  }
  return `s_${normalized}`.slice(0, 63)
}

function pkgName(packageName: string) {
  const trimmed = packageName.trim()
  if (!trimmed) {
    return ""
  }
  const withoutScope = trimmed.includes("/") ? trimmed.split("/").at(-1) || "" : trimmed
  return withoutScope.startsWith("@") ? withoutScope.slice(1) : withoutScope
}

export function schemaName(options: Readonly<{ appId: string; packageName: string; prefix?: string }>) {
  const prefix = schemaId(options.prefix || "app")
  const id = slug(options.appId).slice(0, 12)
  const name = slug(pkgName(options.packageName))
  const candidate = [prefix, id, name].filter(Boolean).join("_")
  return schemaId(candidate)
}

export async function schemaInit(options: Readonly<{ url: string; name: string }>) {
  const name = schemaId(options.name)
  if (!name) {
    throw new Error("Schema name is required.")
  }

  const sql = postgres(options.url, { max: 1, connect_timeout: 10 })
  try {
    await sql.unsafe(`create schema if not exists "${name}"`)
    return { created: true, name }
  } finally {
    await sql.end({ timeout: 5 })
  }
}

export function plugin(options: DbOpts): Plug {
  return {
    name: "db",
    setup(kernel) {
      kernel.set("db", db(options))
    },
  }
}
