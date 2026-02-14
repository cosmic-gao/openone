import { NextResponse } from "next/server"

import { and, desc, eq, inArray, sql } from "drizzle-orm"

import { getDatabase } from "@/database/client"
import { permission, permissionVersion, rolePermission, userRole } from "@/database/schema"
import { readUser } from "@/server/auth"

function getSet(userId: string, applicationKey: string) {
  if (userId.includes("admin")) {
    return {
      version: "1",
      codes: [
        `${applicationKey}:app:use`,
        "admin:app:use",
        "permission:app:use",
        "database:app:use",
      ],
    }
  }

  return {
    version: "1",
    codes: [`${applicationKey}:app:use`, "admin:app:use"],
  }
}

/**
 * 返回当前用户在指定应用范围内的权限集。
 *
 * @param request 请求对象。
 * @returns 权限集响应。
 */
export async function GET(request: Request) {
  const user = await readUser()
  if (!user) {
    return NextResponse.json({ message: "Unauthorized." }, { status: 401 })
  }

  const url = new URL(request.url)
  const applicationKey = url.searchParams.get("applicationKey") || "admin"

  if (!process.env.DATABASE_URL) {
    return NextResponse.json(getSet(user.userId, applicationKey))
  }

  const database = getDatabase()

  const versionList = await database
    .select({ number: sql<number>`max(${permissionVersion.number})` })
    .from(permissionVersion)
    .where(eq(permissionVersion.applicationKey, applicationKey))

  const number = versionList[0]?.number || 0

  const roleList = await database
    .select({ roleId: userRole.roleId })
    .from(userRole)
    .where(eq(userRole.userId, user.userId))

  const roleIds = roleList.map((item) => item.roleId)
  if (roleIds.length === 0) {
    return NextResponse.json({ version: String(number), codes: [] })
  }

  const codeList = await database
    .select({ code: rolePermission.permissionCode })
    .from(rolePermission)
    .where(inArray(rolePermission.roleId, roleIds))
    .orderBy(desc(rolePermission.permissionCode))

  const codes = codeList.map((item) => item.code)
  if (codes.length === 0) {
    return NextResponse.json({ version: String(number), codes: [] })
  }

  const enabled = await database
    .select({ code: permission.code })
    .from(permission)
    .where(and(inArray(permission.code, codes), eq(permission.isEnabled, true)))

  return NextResponse.json({ version: String(number), codes: enabled.map((item) => item.code) })
}
