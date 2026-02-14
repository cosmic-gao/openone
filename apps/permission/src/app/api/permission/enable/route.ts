import { NextResponse } from "next/server"
import { eq } from "drizzle-orm"

import { getDatabase } from "@/database/client"
import { permission } from "@/database/schema"
import { readUser } from "@/server/auth"

/**
 * 启用或禁用指定权限码。
 *
 * @param request 请求对象。
 * @returns 更新结果。
 */
export async function PATCH(request: Request) {
  const user = await readUser()
  if (!user) {
    return NextResponse.json({ message: "Unauthorized." }, { status: 401 })
  }

  const body = (await request.json()) as { code?: string; isEnabled?: boolean }
  const code = body.code?.trim()
  const isEnabled = body.isEnabled

  if (!code || typeof isEnabled !== "boolean") {
    return NextResponse.json({ message: "Invalid input." }, { status: 400 })
  }

  const database = getDatabase()
  const result = await database.update(permission).set({ isEnabled }).where(eq(permission.code, code))

  return NextResponse.json({ isSuccess: true, count: result.count })
}

