import { headers } from "next/headers"

import { context, reader } from "@openone/auth"

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

export async function readUser() {
  const cookie = (await headers()).get("cookie") || undefined
  const sessionReader = reader({ cookieName: getCookie(), secret: getSecret() })
  const session = await sessionReader.read(cookie ? { cookieHeader: cookie } : {})
  return session.isSuccess ? context(session.value) : null
}

export async function readCookieHeader() {
  return (await headers()).get("cookie") || ""
}
