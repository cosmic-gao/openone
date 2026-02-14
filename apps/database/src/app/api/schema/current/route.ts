import { NextResponse } from "next/server"
import { and, desc, eq } from "drizzle-orm"

import { getDatabase } from "@/database/client"
import { schemaVersion } from "@/database/schema"
import { readUser } from "@/server/auth"

/**
 * 查询 Schema 的当前已发布版本。
 *
 * @param request 请求对象。
 * @returns 当前已发布版本。
 */
export async function GET(request: Request) {
  const user = await readUser()
  if (!user) {
    return NextResponse.json({ message: "Unauthorized." }, { status: 401 })
  }

  const url = new URL(request.url)
  const schemaId = url.searchParams.get("schemaId")?.trim()

  if (!schemaId) {
    return NextResponse.json({ message: "Invalid input." }, { status: 400 })
  }

  const database = getDatabase()
  const list = await database
    .select({
      id: schemaVersion.id,
      schemaId: schemaVersion.schemaId,
      number: schemaVersion.number,
      status: schemaVersion.status,
      createdAt: schemaVersion.createdAt,
    })
    .from(schemaVersion)
    .where(and(eq(schemaVersion.schemaId, schemaId), eq(schemaVersion.status, "published")))
    .orderBy(desc(schemaVersion.number))
    .limit(1)

  const current = list[0] || null
  return NextResponse.json({ current })
}
