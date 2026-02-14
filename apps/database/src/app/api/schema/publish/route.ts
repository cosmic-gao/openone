import { NextResponse } from "next/server"
import { and, eq } from "drizzle-orm"

import { getDatabase } from "@/database/client"
import { schemaVersion } from "@/database/schema"
import { readUser } from "@/server/auth"

/**
 * 发布指定 SchemaVersion，自动归档旧的已发布版本。
 *
 * @param request 请求对象。
 * @returns 发布结果。
 */
export async function POST(request: Request) {
  const user = await readUser()
  if (!user) {
    return NextResponse.json({ message: "Unauthorized." }, { status: 401 })
  }

  const body = (await request.json()) as { versionId?: string }
  const versionId = body.versionId?.trim()

  if (!versionId) {
    return NextResponse.json({ message: "Invalid input." }, { status: 400 })
  }

  const database = getDatabase()
  const versionList = await database
    .select({ id: schemaVersion.id, schemaId: schemaVersion.schemaId })
    .from(schemaVersion)
    .where(eq(schemaVersion.id, versionId))

  const target = versionList[0]
  if (!target) {
    return NextResponse.json({ message: "Not found." }, { status: 404 })
  }

  await database.transaction(async (transaction) => {
    await transaction
      .update(schemaVersion)
      .set({ status: "archived" })
      .where(and(eq(schemaVersion.schemaId, target.schemaId), eq(schemaVersion.status, "published")))

    await transaction.update(schemaVersion).set({ status: "published" }).where(eq(schemaVersion.id, versionId))
  })

  return NextResponse.json({ isSuccess: true })
}

