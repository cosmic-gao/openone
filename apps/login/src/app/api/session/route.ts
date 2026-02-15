import { cookies } from "next/headers"
import { NextResponse } from "next/server"

import { signer } from "@openone/auth"

function getCookie() {
  return process.env.SESSION_COOKIE || "openone_session"
}

function getSecret() {
  const secret = process.env.SESSION_SECRET
  if (!secret) {
    throw new Error("SESSION_SECRET is required.")
  }
  return secret
}

/**
 * 创建会话并写入 Cookie。
 *
 * @param request 请求对象。
 * @returns 登录结果。
 */
export async function POST(request: Request) {
  const body = (await request.json()) as { email?: string; password?: string }
  const email = body.email?.trim()
  const password = body.password?.trim()

  if (!email || !password) {
    return NextResponse.json({ message: "Invalid credentials." }, { status: 400 })
  }

  const sessionSigner = signer({ secret: getSecret(), cookieName: getCookie() })
  const token = sessionSigner.sign({
    sessionId: crypto.randomUUID(),
    tenantId: "tenant",
    userId: email,
  })

  const store = await cookies()
  store.set(getCookie(), token, {
    httpOnly: true,
    sameSite: "lax",
    secure: false,
    path: "/",
  })

  return NextResponse.json({ isSuccess: true })
}
