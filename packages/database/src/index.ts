import postgres from "postgres"
import { drizzle } from "drizzle-orm/postgres-js"

export type DatabaseClient = ReturnType<typeof drizzle>

export type DatabaseOptions = Readonly<{
  databaseUrl: string
  applicationName: string
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

  const sql = postgres(url.toString(), {
    max: 10,
    idle_timeout: 20,
    connect_timeout: 10,
  })

  return drizzle(sql)
}
