import { NextResponse } from "next/server"
import { desc, eq, sql } from "drizzle-orm"

import { getDatabase } from "@/database/client"
import { permissionVersion } from "@/database/schema"
import { readUser } from "@/server/auth"

/**
 * 发布指定应用的权限版本（版本号自增）。
 *
 * @param request 请求对象。
 * @returns 最新发布版本号。
 */
export async function POST(request: Request) {
  const user = await readUser()
  if (!user) {
    return NextResponse.json({ message: "Unauthorized." }, { status: 401 })
  }

  const body = (await request.json()) as { applicationKey?: string }
  const applicationKey = body.applicationKey?.trim()
  if (!applicationKey) {
    return NextResponse.json({ message: "Invalid input." }, { status: 400 })
  }

  const database = getDatabase()
  const list = await database
    .select({ number: permissionVersion.number })
    .from(permissionVersion)
    .where(eq(permissionVersion.applicationKey, applicationKey))
    .orderBy(desc(permissionVersion.number))
    .limit(1)

  const current = list[0]?.number || 0
  const next = current + 1

  await database.insert(permissionVersion).values({
    id: crypto.randomUUID(),
    applicationKey,
    number: next,
  })

  return NextResponse.json({ version: String(next) })
}

/**
 * 查询指定应用的最新权限版本号。
 *
 * @param request 请求对象。
 * @returns 最新版本号。
 */
export async function GET(request: Request) {
  const user = await readUser()
  if (!user) {
    return NextResponse.json({ message: "Unauthorized." }, { status: 401 })
  }

  const url = new URL(request.url)
  const applicationKey = url.searchParams.get("applicationKey")?.trim()
  if (!applicationKey) {
    return NextResponse.json({ message: "Invalid input." }, { status: 400 })
  }

  const database = getDatabase()
  const list = await database
    .select({ number: sql<number>`max(${permissionVersion.number})` })
    .from(permissionVersion)
    .where(eq(permissionVersion.applicationKey, applicationKey))

  const number = list[0]?.number || 0
  return NextResponse.json({ version: String(number) })
}

