import { createDatabase } from "@openone/database"

/**
 * 获取 PermissionApplication 的数据库客户端。
 *
 * @returns Drizzle 数据库客户端。
 * @throws Error 缺少 DATABASE_URL 或初始化失败时抛出。
 */
export function getDatabase() {
  const databaseUrl = process.env.DATABASE_URL
  if (!databaseUrl) {
    throw new Error("DATABASE_URL is required.")
  }

  return createDatabase({ databaseUrl, applicationName: "permission" })
}
