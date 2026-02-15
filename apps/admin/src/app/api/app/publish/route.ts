import fs from "node:fs/promises"
import path from "node:path"
import { createHash, createHmac } from "node:crypto"

import { NextResponse } from "next/server"

import { readCookieHeader, readUser } from "@/server/auth"

type Bundle = Readonly<{
  applicationKey: string
  name: string
  permissions: Array<Readonly<{ code: string; name: string }>>
  schema: Readonly<{ name: string; definition: Record<string, unknown> }> | null
}>

function getPermissionUrl() {
  return process.env.PERMISSION_URL || "http://localhost:3002"
}

function getDatabaseUrl() {
  return process.env.DATABASE_APP_URL || "http://localhost:3003"
}

function hashText(text: string) {
  return createHash("sha256").update(text).digest("base64url")
}

function sign(secret: string, text: string) {
  return createHmac("sha256", secret).update(text).digest("base64url")
}

function normalizeCode(applicationKey: string, code: string) {
  const trimmed = code.trim()
  if (!trimmed) {
    return ""
  }
  if (trimmed.startsWith(`${applicationKey}:`)) {
    return trimmed
  }
  return `${applicationKey}:${trimmed.replace(/^:+/, "")}`
}

async function readBundle(id: string): Promise<Bundle> {
  const file = path.join(process.cwd(), "uploads", `${id}.json`)
  const raw = await fs.readFile(file, "utf8")
  return JSON.parse(raw) as Bundle
}

async function writeResult(id: string, result: unknown) {
  const file = path.join(process.cwd(), "uploads", `${id}.result.json`)
  await fs.writeFile(file, JSON.stringify(result, null, 2))
}

async function fetchJson(input: RequestInfo, init?: RequestInit) {
  const response = await fetch(input, init)
  const text = await response.text()
  let body: unknown = null
  try {
    body = text ? (JSON.parse(text) as unknown) : null
  } catch {
    body = text
  }
  return { response, body }
}

export async function POST(request: Request) {
  const user = await readUser()
  if (!user) {
    return NextResponse.json({ message: "Unauthorized." }, { status: 401 })
  }

  const body = (await request.json()) as { id?: string }
  const id = body.id?.trim()
  if (!id) {
    return NextResponse.json({ message: "Invalid input." }, { status: 400 })
  }

  let bundle: Bundle
  try {
    bundle = await readBundle(id)
  } catch {
    return NextResponse.json({ message: "Not found." }, { status: 404 })
  }

  const cookie = await readCookieHeader()
  const permissionUrl = getPermissionUrl()
  const databaseUrl = getDatabaseUrl()

  const appKey = bundle.applicationKey

  const appResp = await fetchJson(`${permissionUrl}/api/application`, {
    method: "POST",
    headers: { "content-type": "application/json", cookie },
    body: JSON.stringify({ key: appKey, name: bundle.name }),
    cache: "no-store",
  })
  if (!appResp.response.ok) {
    await writeResult(id, { step: "permission.application", status: appResp.response.status, body: appResp.body })
    return NextResponse.json({ message: "Permission sync failed." }, { status: 502 })
  }
  const app = appResp.body as { key: string; secret: string }

  const registerBody = JSON.stringify({
    list: bundle.permissions.map((p) => ({ code: normalizeCode(appKey, p.code), name: p.name })),
  })
  const time = String(Date.now())
  const nonce = crypto.randomUUID().replaceAll("-", "")
  const payload = `${time}.${nonce}.${hashText(registerBody)}`
  const signature = sign(app.secret, payload)

  const regResp = await fetchJson(`${permissionUrl}/api/permission/register`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-app-key": appKey,
      "x-time": time,
      "x-nonce": nonce,
      "x-sign": signature,
    },
    body: registerBody,
    cache: "no-store",
  })
  if (!regResp.response.ok) {
    await writeResult(id, { step: "permission.register", status: regResp.response.status, body: regResp.body })
    return NextResponse.json({ message: "Permission sync failed." }, { status: 502 })
  }

  const pubPermResp = await fetchJson(`${permissionUrl}/api/permission/publish`, {
    method: "POST",
    headers: { "content-type": "application/json", cookie },
    body: JSON.stringify({ applicationKey: appKey }),
    cache: "no-store",
  })
  if (!pubPermResp.response.ok) {
    await writeResult(id, { step: "permission.publish", status: pubPermResp.response.status, body: pubPermResp.body })
    return NextResponse.json({ message: "Permission publish failed." }, { status: 502 })
  }

  let schemaSync: unknown = null
  if (bundle.schema) {
    const schemaName = bundle.schema.name
    const listResp = await fetchJson(`${databaseUrl}/api/schema?applicationKey=${encodeURIComponent(appKey)}`, {
      headers: { cookie },
      cache: "no-store",
    })
    if (!listResp.response.ok) {
      await writeResult(id, { step: "db.schema.list", status: listResp.response.status, body: listResp.body })
      return NextResponse.json({ message: "Schema sync failed." }, { status: 502 })
    }

    const list = (listResp.body as { list?: Array<{ id: string; name: string; applicationKey: string }> }).list || []
    const existing = list.find((s) => s.name === schemaName) || null

    let schemaId = existing?.id || ""
    if (!schemaId) {
      const createResp = await fetchJson(`${databaseUrl}/api/schema`, {
        method: "POST",
        headers: { "content-type": "application/json", cookie },
        body: JSON.stringify({ applicationKey: appKey, name: schemaName }),
        cache: "no-store",
      })
      if (!createResp.response.ok) {
        await writeResult(id, { step: "db.schema.create", status: createResp.response.status, body: createResp.body })
        return NextResponse.json({ message: "Schema sync failed." }, { status: 502 })
      }
      schemaId = (createResp.body as { id?: string }).id || ""
    }
    if (!schemaId) {
      await writeResult(id, { step: "db.schema.create", status: 500, body: "Missing schemaId." })
      return NextResponse.json({ message: "Schema sync failed." }, { status: 502 })
    }

    const versionResp = await fetchJson(`${databaseUrl}/api/schema/version`, {
      method: "POST",
      headers: { "content-type": "application/json", cookie },
      body: JSON.stringify({ schemaId, definition: bundle.schema.definition }),
      cache: "no-store",
    })
    if (!versionResp.response.ok) {
      await writeResult(id, { step: "db.schema.version", status: versionResp.response.status, body: versionResp.body })
      return NextResponse.json({ message: "Schema sync failed." }, { status: 502 })
    }
    const versionId = (versionResp.body as { id: string }).id

    const publishResp = await fetchJson(`${databaseUrl}/api/schema/publish`, {
      method: "POST",
      headers: { "content-type": "application/json", cookie },
      body: JSON.stringify({ versionId }),
      cache: "no-store",
    })
    if (!publishResp.response.ok) {
      await writeResult(id, { step: "db.schema.publish", status: publishResp.response.status, body: publishResp.body })
      return NextResponse.json({ message: "Schema publish failed." }, { status: 502 })
    }

    schemaSync = { schemaId, versionId }
  }

  const result = { isSuccess: true, id, applicationKey: appKey, schema: schemaSync, permissionVersion: pubPermResp.body }
  await writeResult(id, result)
  return NextResponse.json(result)
}
