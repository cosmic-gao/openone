"use client"

import { usePathname } from "next/navigation"

import { SidebarTrigger } from "@/components/ui/sidebar"

function titleFromPath(pathname: string) {
  if (pathname.startsWith("/dashboard/app/")) {
    const key = pathname.split("/")[3] || ""
    return key ? key.charAt(0).toUpperCase() + key.slice(1) : "App"
  }
  if (pathname.startsWith("/dashboard/overview")) {
    return "Overview"
  }
  return "Dashboard"
}

export function Header() {
  const pathname = usePathname()
  const title = titleFromPath(pathname)
  return (
    <header className="flex items-center gap-3 border-b border-border bg-background px-4 py-3">
      <SidebarTrigger />
      <div className="text-sm font-medium">{title}</div>
      <div className="ml-auto flex items-center gap-2" />
    </header>
  )
}
