"use client"

import { useMemo, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"

export function SigninForm() {
  const router = useRouter()
  const search = useSearchParams()
  const next = search.get("next")

  const fallback = useMemo(() => process.env.NEXT_PUBLIC_MANAGER_URL || "http://localhost:3001", [])
  const redirect = next || fallback

  const [email, setEmail] = useState("demo@openone.com")
  const [password, setPassword] = useState("demo")
  const [isSaving, setIsSaving] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  async function submit() {
    setIsSaving(true)
    setMessage(null)
    try {
      const response = await fetch("/api/session", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email, password }),
      })

      if (!response.ok) {
        const result = (await response.json()) as { message?: string }
        setMessage(result.message || "Sign in failed.")
        return
      }

      router.replace(redirect)
    } catch {
      setMessage("Sign in failed.")
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col gap-4 px-6 py-10">
      <h1 className="text-2xl font-semibold">Sign in</h1>
      <label className="flex flex-col gap-1">
        <span className="text-sm text-muted-foreground">Email</span>
        <input
          className="h-10 rounded-md border border-input bg-background px-3 text-sm"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          autoComplete="username"
        />
      </label>
      <label className="flex flex-col gap-1">
        <span className="text-sm text-muted-foreground">Password</span>
        <input
          className="h-10 rounded-md border border-input bg-background px-3 text-sm"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          type="password"
          autoComplete="current-password"
        />
      </label>
      {message ? <p className="text-sm text-destructive">{message}</p> : null}
      <button
        className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground disabled:opacity-60"
        disabled={isSaving}
        onClick={submit}
      >
        {isSaving ? "Signing in..." : "Sign in"}
      </button>
      <p className="text-sm text-muted-foreground">Redirect: {redirect}</p>
    </main>
  )
}

