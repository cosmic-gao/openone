import { NextResponse } from "next/server"
import { asc, desc, eq, sql } from "drizzle-orm"

import { getDatabase } from "@/database/client"
import { schemaVersion } from "@/database/schema"
import { readUser } from "@/server/auth"

type Status = "draft" | "published" | "archived"

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

/**
 * 创建 Schema 草稿版本。
 *
 * @param request 请求对象。
 * @returns SchemaVersion 信息。
 */
export async function POST(request: Request) {
  const user = await readUser()
  if (!user) {
    return NextResponse.json({ message: "Unauthorized." }, { status: 401 })
  }

  const body = (await request.json()) as { schemaId?: string; definition?: unknown }
  const schemaId = body.schemaId?.trim()
  const definition = body.definition

  if (!schemaId || !isObject(definition)) {
    return NextResponse.json({ message: "Invalid input." }, { status: 400 })
  }

  const database = getDatabase()
  const list = await database
    .select({ number: sql<number>`max(${schemaVersion.number})` })
    .from(schemaVersion)
    .where(eq(schemaVersion.schemaId, schemaId))

  const current = list[0]?.number || 0
  const next = current + 1
  const id = crypto.randomUUID()

  const status: Status = "draft"
  await database.insert(schemaVersion).values({ id, schemaId, number: next, status, definition })

  return NextResponse.json({ id, schemaId, number: next, status })
}

/**
 * 查询 Schema 版本列表。
 *
 * @param request 请求对象。
 * @returns SchemaVersion 列表。
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
    .where(eq(schemaVersion.schemaId, schemaId))
    .orderBy(desc(schemaVersion.number), asc(schemaVersion.createdAt))

  return NextResponse.json({ list })
}

