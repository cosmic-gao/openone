"use client"

import * as React from "react"

import { mergeClassName } from "@/lib/utils"

type SidebarContextValue = Readonly<{
  open: boolean
  toggle: () => void
}>

const SidebarContext = React.createContext<SidebarContextValue | null>(null)

function readCookie(name: string) {
  const items = document.cookie.split(";").map((s) => s.trim())
  for (const item of items) {
    if (item.startsWith(`${name}=`)) {
      return decodeURIComponent(item.slice(name.length + 1))
    }
  }
  return null
}

function writeCookie(name: string, value: string) {
  document.cookie = `${name}=${encodeURIComponent(value)}; path=/; SameSite=Lax`
}

export function SidebarProvider({
  children,
  defaultOpen = true,
}: Readonly<{ children: React.ReactNode; defaultOpen?: boolean }>) {
  const [open, setOpen] = React.useState(defaultOpen)

  React.useEffect(() => {
    const value = readCookie("sidebar_state")
    if (value === "true") {
      setOpen(true)
    }
    if (value === "false") {
      setOpen(false)
    }
  }, [])

  const toggle = React.useCallback(() => {
    const next = !open
    setOpen(next)
    writeCookie("sidebar_state", next ? "true" : "false")
  }, [open])

  return <SidebarContext.Provider value={{ open, toggle }}>{children}</SidebarContext.Provider>
}

export function useSidebar() {
  const value = React.useContext(SidebarContext)
  if (!value) {
    throw new Error("SidebarProvider is required.")
  }
  return value
}

export function Sidebar({ children, className }: Readonly<{ children: React.ReactNode; className?: string }>) {
  const { open } = useSidebar()
  return (
    <aside
      data-open={open ? "true" : "false"}
      className={mergeClassName(
        "border-r border-border bg-sidebar text-sidebar-foreground h-dvh w-[18rem] shrink-0 hidden md:flex md:flex-col",
        className
      )}
    >
      {children}
    </aside>
  )
}

export function SidebarHeader({ children, className }: Readonly<{ children: React.ReactNode; className?: string }>) {
  return <div className={mergeClassName("px-4 py-3", className)}>{children}</div>
}

export function SidebarContent({ children, className }: Readonly<{ children: React.ReactNode; className?: string }>) {
  return <div className={mergeClassName("px-2 pb-3", className)}>{children}</div>
}

export function SidebarInset({ children, className }: Readonly<{ children: React.ReactNode; className?: string }>) {
  return <div className={mergeClassName("flex min-w-0 flex-1 flex-col", className)}>{children}</div>
}

export function SidebarTrigger({ className }: Readonly<{ className?: string }>) {
  const { toggle } = useSidebar()
  return (
    <button
      type="button"
      onClick={toggle}
      className={mergeClassName(
        "inline-flex h-9 w-9 items-center justify-center rounded-md border border-border bg-background hover:bg-accent hover:text-accent-foreground",
        className
      )}
      aria-label="Toggle sidebar"
    >
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M4 6h16M4 12h16M4 18h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </svg>
    </button>
  )
}

export function SidebarNavLink({
  href,
  active,
  children,
}: Readonly<{ href: string; active: boolean; children: React.ReactNode }>) {
  return (
    <a
      href={href}
      data-active={active ? "true" : "false"}
      className={mergeClassName(
        "w-full inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm hover:bg-sidebar-accent hover:text-sidebar-accent-foreground data-[active=true]:bg-sidebar-accent data-[active=true]:text-sidebar-accent-foreground"
      )}
    >
      {children}
    </a>
  )
}

