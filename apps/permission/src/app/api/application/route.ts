import { NextResponse } from "next/server"

import { getDatabase } from "@/database/client"
import { application } from "@/database/schema"
import { readUser } from "@/server/auth"

function getSecret() {
  return crypto.randomUUID().replaceAll("-", "")
}

/**
 * 创建用于权限注册的应用条目。
 *
 * @param request 请求对象。
 * @returns 应用标识与密钥。
 */
export async function POST(request: Request) {
  const user = await readUser()
  if (!user) {
    return NextResponse.json({ message: "Unauthorized." }, { status: 401 })
  }

  const body = (await request.json()) as { key?: string; name?: string }
  const key = body.key?.trim()
  const name = body.name?.trim()

  if (!key || !name) {
    return NextResponse.json({ message: "Invalid input." }, { status: 400 })
  }

  const secret = getSecret()
  const database = getDatabase()

  await database.insert(application).values({ key, name, secret })

  return NextResponse.json({ key, secret })
}

/**
 * 查询已注册的应用列表。
 *
 * @returns 应用列表。
 */
export async function GET() {
  const user = await readUser()
  if (!user) {
    return NextResponse.json({ message: "Unauthorized." }, { status: 401 })
  }

  const database = getDatabase()
  const list = await database.select({ key: application.key, name: application.name }).from(application)
  return NextResponse.json({ list })
}
