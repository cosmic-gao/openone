import type { PlatformError, Result, UserContext } from "@openone/kernel"
import { createHmac, timingSafeEqual } from "node:crypto"

export type Session = Readonly<{
  sessionId: string
  tenantId: string
  userId: string
}>

export type SessionOptions = Readonly<{
  secret: string
  cookieName: string
}>

export type SessionSigner = Readonly<{
  /**
   * 将会话签名为可放入 Cookie 的令牌字符串。
   *
   * @param session 会话内容。
   * @returns 令牌字符串。
   * @throws Error secret 为空或签名失败时抛出。
   */
  sign: (session: Session) => string

  /**
   * 验证令牌并解析会话。
   *
   * @param token 令牌字符串。
   * @returns 会话结果。
   * @throws Error secret 为空或解析失败时抛出。
   */
  verify: (token: string) => Result<Session, PlatformError>
}>

export type SessionReader = Readonly<{
  /**
   * 从请求容器中读取会话。
   *
   * @param input 请求容器。
   * @returns 存在且有效的会话结果。
   * @throws Error 底层存储发生非预期失败时抛出。
   */
  read: (input: { cookieHeader?: string }) => Promise<Result<Session, PlatformError>>
}>

function ok<TValue, TError>(value: TValue): Result<TValue, TError> {
  return { isSuccess: true, value }
}

function fail<TValue, TError>(error: TError): Result<TValue, TError> {
  return { isSuccess: false, error }
}

function readCookie(cookieHeader: string, name: string): string | undefined {
  const parts = cookieHeader.split(";")
  for (const part of parts) {
    const [key, ...rest] = part.trim().split("=")
    if (key === name) {
      return rest.join("=")
    }
  }
  return undefined
}

function encodeText(text: string): string {
  return Buffer.from(text, "utf8").toString("base64url")
}

function decodeText(text: string): string {
  return Buffer.from(text, "base64url").toString("utf8")
}

function createHash(secret: string, text: string): string {
  return createHmac("sha256", secret).update(text).digest("base64url")
}

/**
 * 创建会话签名器，用于在各应用之间共享会话 Cookie 格式。
 *
 * @param options 会话签名参数。
 * @returns 会话签名器。
 * @throws Error secret 为空时抛出。
 */
export function createSigner(options: SessionOptions): SessionSigner {
  if (!options.secret) {
    throw new Error("SESSION_SECRET is required.")
  }

  return {
    sign(session) {
      const payload = encodeText(JSON.stringify(session))
      const hash = createHash(options.secret, payload)
      return `${payload}.${hash}`
    },

    verify(token) {
      const [payload, hash] = token.split(".")
      if (!payload || !hash) {
        return fail({
          code: "UNAUTHORIZED",
          message: "Invalid session token.",
        })
      }

      const expected = createHash(options.secret, payload)
      const isValid =
        expected.length === hash.length && timingSafeEqual(Buffer.from(expected), Buffer.from(hash))

      if (!isValid) {
        return fail({
          code: "UNAUTHORIZED",
          message: "Invalid session token.",
        })
      }

      try {
        const session = JSON.parse(decodeText(payload)) as Session
        if (!session.sessionId || !session.tenantId || !session.userId) {
          return fail({
            code: "UNAUTHORIZED",
            message: "Invalid session token.",
          })
        }
        return ok(session)
      } catch {
        return fail({
          code: "UNAUTHORIZED",
          message: "Invalid session token.",
        })
      }
    },
  }
}

/**
 * 创建会话读取器，用于从 Cookie 中提取并验证会话。
 *
 * @param options 会话读取参数。
 * @returns 会话读取器。
 */
export function createReader(options: SessionOptions): SessionReader {
  const signer = createSigner(options)

  return {
    async read(input) {
      const cookieHeader = input.cookieHeader
      if (!cookieHeader) {
        return fail({ code: "UNAUTHORIZED", message: "Missing session." })
      }

      const token = readCookie(cookieHeader, options.cookieName)
      if (!token) {
        return fail({ code: "UNAUTHORIZED", message: "Missing session." })
      }

      return signer.verify(token)
    },
  }
}

/**
 * 将会话转换为用户上下文。
 *
 * @param session 待转换会话。
 * @returns 用户上下文。
 * @example
 * const context = createContext({ sessionId: "s1", tenantId: "t1", userId: "u1" })
 */
export function createContext(session: Session): UserContext {
  return {
    sessionId: session.sessionId,
    tenantId: session.tenantId,
    userId: session.userId,
  }
}
