"use client"

import dynamic from "next/dynamic"
import type React from "react"

const WujieReact = dynamic<any>(() => import("wujie-react").then((m: any) => m.default), { ssr: false })

export function MicroApp({ name, url }: Readonly<{ name: string; url: string }>) {
  const App = WujieReact as unknown as React.ComponentType<any>
  return <App width="100%" height="100%" name={name} url={url} sync={true} alive={true} />
}
