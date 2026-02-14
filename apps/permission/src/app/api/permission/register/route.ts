import { createHash, createHmac, timingSafeEqual } from "node:crypto"

import { NextResponse } from "next/server"
import { eq, sql } from "drizzle-orm"

import { getDatabase } from "@/database/client"
import { application, permission } from "@/database/schema"

function readText(request: Request) {
  return request.text()
}

function hashText(text: string) {
  return createHash("sha256").update(text).digest("base64url")
}

function sign(secret: string, text: string) {
  return createHmac("sha256", secret).update(text).digest("base64url")
}

function isSafeEqual(left: string, right: string) {
  return left.length === right.length && timingSafeEqual(Buffer.from(left), Buffer.from(right))
}

function isFresh(timeText: string) {
  const time = Number(timeText)
  if (!Number.isFinite(time)) {
    return false
  }
  const diff = Math.abs(Date.now() - time)
  return diff <= 5 * 60 * 1000
}

async function getSecret(key: string) {
  const database = getDatabase()
  const list = await database.select({ secret: application.secret }).from(application).where(eq(application.key, key))
  return list[0]?.secret || null
}

/**
 * 注册或更新应用权限清单（需要签名）。
 *
 * Headers:
 * - x-app-key: 应用标识
 * - x-time: 毫秒时间戳
 * - x-nonce: 随机串
 * - x-sign: base64url(HMAC_SHA256(secret, `${time}.${nonce}.${bodyHash}`))
 *
 * @param request 请求对象。
 * @returns 注册结果。
 */
export async function POST(request: Request) {
  const key = request.headers.get("x-app-key")?.trim()
  const time = request.headers.get("x-time")?.trim()
  const nonce = request.headers.get("x-nonce")?.trim()
  const signature = request.headers.get("x-sign")?.trim()

  if (!key || !time || !nonce || !signature) {
    return NextResponse.json({ message: "Unauthorized." }, { status: 401 })
  }

  if (!isFresh(time)) {
    return NextResponse.json({ message: "Unauthorized." }, { status: 401 })
  }

  const text = await readText(request)
  let body: { list?: Array<{ code?: string; name?: string }> }
  try {
    body = JSON.parse(text) as { list?: Array<{ code?: string; name?: string }> }
  } catch {
    return NextResponse.json({ message: "Invalid input." }, { status: 400 })
  }
  const list = body.list || []

  if (!Array.isArray(list) || list.length === 0) {
    return NextResponse.json({ message: "Invalid input." }, { status: 400 })
  }

  const secret = await getSecret(key)
  if (!secret) {
    return NextResponse.json({ message: "Unauthorized." }, { status: 401 })
  }

  const payload = `${time}.${nonce}.${hashText(text)}`
  const expected = sign(secret, payload)
  if (!isSafeEqual(expected, signature)) {
    return NextResponse.json({ message: "Unauthorized." }, { status: 401 })
  }

  const values = list
    .map((item) => {
      const code = item.code?.trim()
      const name = item.name?.trim()
      if (!code || !name) {
        return null
      }
      if (!code.startsWith(`${key}:`)) {
        return null
      }
      return { code, name, applicationKey: key, isEnabled: true }
    })
    .filter(Boolean) as Array<{ code: string; name: string; applicationKey: string; isEnabled: boolean }>

  if (values.length === 0) {
    return NextResponse.json({ message: "Invalid input." }, { status: 400 })
  }

  const database = getDatabase()
  await database
    .insert(permission)
    .values(values)
    .onConflictDoUpdate({
      target: permission.code,
      set: {
        name: sql`excluded.name`,
        applicationKey: sql`excluded.application_key`,
        isEnabled: true,
      },
    })

  return NextResponse.json({ isSuccess: true, count: values.length })
}
