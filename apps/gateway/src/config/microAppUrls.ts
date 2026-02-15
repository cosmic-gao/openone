import "server-only"

import type { MicroAppKey } from "@/config/microApps"

function readUrl(key: string, fallback: string) {
  const value = process.env[key]
  return value && value.trim() ? value.trim() : fallback
}

export function getAppUrl(key: MicroAppKey): string | null {
  if (key === "login") {
    return readUrl("MICRO_LOGIN_URL", "http://localhost:3000")
  }
  if (key === "admin") {
    return readUrl("MICRO_ADMIN_URL", "http://localhost:3004")
  }
  if (key === "permission") {
    return readUrl("MICRO_PERMISSION_URL", "http://localhost:3002")
  }
  if (key === "database") {
    return readUrl("MICRO_DATABASE_URL", "http://localhost:3003")
  }
  return null
}

