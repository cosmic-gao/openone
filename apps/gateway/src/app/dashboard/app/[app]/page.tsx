import { notFound } from "next/navigation"

import type { MicroAppKey } from "@/config/microApps"
import { getAppUrl } from "@/config/microAppUrls"
import { MicroApp } from "@/components/micro/MicroApp"

export default function MicroAppPage({ params }: Readonly<{ params: { app: string } }>) {
  const app = params.app
  if (app !== "login" && app !== "admin" && app !== "permission" && app !== "database") {
    notFound()
  }
  const url = getAppUrl(app as MicroAppKey)
  if (!url) {
    notFound()
  }

  return (
    <div className="h-[calc(100dvh-var(--header-height,48px))]">
      <MicroApp name={app} url={url} />
    </div>
  )
}
