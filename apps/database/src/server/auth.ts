import { headers } from "next/headers"

import { context, reader } from "@openone/authentication"

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
 * 读取当前请求对应的用户上下文。
 *
 * @returns 用户上下文；未登录则返回 null。
 * @throws Error 环境变量缺失或底层读取失败时抛出。
 */
export async function readUser() {
  const cookie = (await headers()).get("cookie") || undefined
  const sessionReader = reader({ cookieName: getCookie(), secret: getSecret() })
  const session = await sessionReader.read(cookie ? { cookieHeader: cookie } : {})
  return session.isSuccess ? context(session.value) : null
}
