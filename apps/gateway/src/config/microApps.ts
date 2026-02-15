export type MicroAppKey = "overview" | "login" | "admin" | "permission" | "database"

export function getNavItems(): ReadonlyArray<Readonly<{ key: MicroAppKey; title: string }>> {
  return [
    { key: "overview", title: "Overview" },
    { key: "admin", title: "Admin" },
    { key: "permission", title: "Permission" },
    { key: "database", title: "Database" },
    { key: "login", title: "Login" },
  ]
}
