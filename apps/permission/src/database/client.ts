import { db, schemaName } from "@openone/database"

import packageJson from "../../package.json"

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

  const appId = packageJson.openone?.appId
  if (!appId) {
    throw new Error("openone.appId is required.")
  }

  const pgSchema = schemaName({ appId, packageName: packageJson.name })
  return db({ databaseUrl, applicationName: "permission", pgSchema })
}
