"use client"

import { usePathname } from "next/navigation"

import type { MicroAppKey } from "@/config/microApps"
import { getNavItems } from "@/config/microApps"
import { Sidebar, SidebarContent, SidebarHeader, SidebarNavLink } from "@/components/ui/sidebar"

export function AppSidebar({ allowedKeys }: Readonly<{ allowedKeys: ReadonlyArray<MicroAppKey> }>) {
  const pathname = usePathname()
  const items = getNavItems().filter((i) => i.key === "overview" || allowedKeys.includes(i.key))
  return (
    <Sidebar>
      <SidebarHeader>
        <div className="text-sm font-semibold">OpenOne</div>
      </SidebarHeader>
      <SidebarContent>
        <nav className="flex flex-col gap-1">
          {items.map((item) => {
            const href = item.key === "overview" ? "/dashboard/overview" : `/dashboard/app/${item.key}`
            const active = pathname === href || pathname.startsWith(`${href}/`)
            return (
              <SidebarNavLink key={item.key} href={href} active={active}>
                <span className="truncate">{item.title}</span>
              </SidebarNavLink>
            )
          })}
        </nav>
      </SidebarContent>
    </Sidebar>
  )
}
