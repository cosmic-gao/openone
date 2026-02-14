import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

function getLogin() {
  return process.env.LOGIN_URL || "http://localhost:3000"
}

function getCookie() {
  return process.env.SESSION_COOKIE || "openone_session"
}

/**
 * 统一登录守卫：未检测到会话 Cookie 时跳转到 LoginApplication。
 *
 * @param request 请求对象。
 * @returns NextResponse
 */
export function middleware(request: NextRequest) {
  const token = request.cookies.get(getCookie())?.value
  if (token) {
    return NextResponse.next()
  }

  const next = request.nextUrl.toString()
  const url = new URL(`${getLogin()}/signin`)
  url.searchParams.set("next", next)
  return NextResponse.redirect(url)
}

export const config = {
  matcher: ["/((?!_next|favicon.ico|api).*)"],
}
