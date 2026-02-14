import { NextResponse } from "next/server"
import { asc, eq } from "drizzle-orm"

import { getDatabase } from "@/database/client"
import { schema } from "@/database/schema"
import { readUser } from "@/server/auth"

/**
 * 创建 Schema。
 *
 * @param request 请求对象。
 * @returns Schema 信息。
 */
export async function POST(request: Request) {
  const user = await readUser()
  if (!user) {
    return NextResponse.json({ message: "Unauthorized." }, { status: 401 })
  }

  const body = (await request.json()) as { applicationKey?: string; name?: string }
  const applicationKey = body.applicationKey?.trim()
  const name = body.name?.trim()

  if (!applicationKey || !name) {
    return NextResponse.json({ message: "Invalid input." }, { status: 400 })
  }

  const database = getDatabase()
  const id = crypto.randomUUID()

  await database.insert(schema).values({ id, applicationKey, name })

  return NextResponse.json({ id, applicationKey, name })
}

/**
 * 查询 Schema 列表。
 *
 * @param request 请求对象。
 * @returns Schema 列表。
 */
export async function GET(request: Request) {
  const user = await readUser()
  if (!user) {
    return NextResponse.json({ message: "Unauthorized." }, { status: 401 })
  }

  const url = new URL(request.url)
  const applicationKey = url.searchParams.get("applicationKey")?.trim()

  const database = getDatabase()
  const query = database.select().from(schema).orderBy(asc(schema.name))

  if (!applicationKey) {
    return NextResponse.json({ list: await query })
  }

  return NextResponse.json({
    list: await database.select().from(schema).where(eq(schema.applicationKey, applicationKey)).orderBy(asc(schema.name)),
  })
}

