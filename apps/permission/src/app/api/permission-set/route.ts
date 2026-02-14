import { headers } from "next/headers"
import { NextResponse } from "next/server"

import { createReader } from "@openone/authentication"

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

function getSet(userId: string, applicationKey: string) {
  if (userId.includes("admin")) {
    return {
      version: "1",
      codes: [
        `${applicationKey}:app:use`,
        "manager:app:use",
        "permission:app:use",
        "database-center:app:use",
      ],
    }
  }

  return {
    version: "1",
    codes: [`${applicationKey}:app:use`, "manager:app:use"],
  }
}

/**
 * 返回当前用户在指定应用范围内的权限集。
 *
 * @param request 请求对象。
 * @returns 权限集响应。
 */
export async function GET(request: Request) {
  const header = (await headers()).get("cookie") || undefined
  const reader = createReader({ cookieName: getCookie(), secret: getSecret() })
  const session = await reader.read(header ? { cookieHeader: header } : {})

  if (!session.isSuccess) {
    return NextResponse.json({ message: "Unauthorized." }, { status: 401 })
  }

  const url = new URL(request.url)
  const applicationKey = url.searchParams.get("applicationKey") || "manager"

  return NextResponse.json(getSet(session.value.userId, applicationKey))
}
