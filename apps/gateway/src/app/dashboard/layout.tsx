import { cookies } from "next/headers"

import { AppSidebar } from "@/components/layout/app-sidebar"
import { Header } from "@/components/layout/header"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import type { MicroAppKey } from "@/config/microApps"

function getCookieName() {
  return process.env.SESSION_COOKIE || "openone_session"
}

function getPermissionUrl() {
  return process.env.PERMISSION_URL || "http://localhost:3002"
}

async function getAllowedKeys(): Promise<Array<MicroAppKey>> {
  const store = await cookies()
  const token = store.get(getCookieName())?.value
  if (!token) {
    return ["login"]
  }

  const response = await fetch(`${getPermissionUrl()}/api/permission-set?applicationKey=gateway`, {
    headers: { cookie: `${getCookieName()}=${token}` },
    cache: "no-store",
  })
  if (!response.ok) {
    return ["login"]
  }

  const result = (await response.json()) as { codes?: Array<string> }
  const codes = result.codes || []
  const keys = new Set<MicroAppKey>()
  for (const code of codes) {
    const [key, resource, action] = code.split(":")
    if (resource === "app" && action === "use") {
      if (key === "login" || key === "admin" || key === "permission" || key === "database") {
        keys.add(key)
      }
    }
  }
  if (keys.size === 0) {
    keys.add("login")
  }
  return [...keys]
}

export default async function DashboardLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const cookieStore = await cookies()
  const defaultOpen = cookieStore.get("sidebar_state")?.value === "true"
  const allowedKeys = await getAllowedKeys()

  return (
    <SidebarProvider defaultOpen={defaultOpen}>
      <div className="flex min-h-dvh">
        <AppSidebar allowedKeys={allowedKeys} />
        <SidebarInset>
          <Header />
          <div className="min-h-0 flex-1">{children}</div>
        </SidebarInset>
      </div>
    </SidebarProvider>
  )
}
