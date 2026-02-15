import fs from "node:fs/promises"
import path from "node:path"

import { NextResponse } from "next/server"

type Bundle = Readonly<{
  applicationKey: string
  name: string
  permissions?: Array<Readonly<{ code?: string; name?: string }>>
  schema?: Readonly<{ name?: string; definition?: unknown }>
}>

function normalizeBundle(input: Bundle) {
  const applicationKey = input.applicationKey.trim()
  const name = input.name.trim()
  if (!applicationKey || !name) {
    throw new Error("Invalid bundle.")
  }
  const permissions = (input.permissions || [])
    .map((p) => {
      const code = p.code?.trim()
      const pname = p.name?.trim()
      if (!code || !pname) {
        return null
      }
      return { code, name: pname }
    })
    .filter(Boolean) as Array<{ code: string; name: string }>

  const schemaName = input.schema?.name?.trim() || name
  const definition = input.schema?.definition && typeof input.schema.definition === "object" ? input.schema.definition : null

  return { applicationKey, name, permissions, schema: definition ? { name: schemaName, definition } : null }
}

async function ensureUploads() {
  const dir = path.join(process.cwd(), "uploads")
  await fs.mkdir(dir, { recursive: true })
  return dir
}

export async function POST(request: Request) {
  const contentType = request.headers.get("content-type") || ""
  const uploads = await ensureUploads()
  const id = crypto.randomUUID()

  let bundle: Bundle
  let raw: string

  if (contentType.includes("application/json")) {
    raw = await request.text()
    bundle = JSON.parse(raw) as Bundle
  } else {
    const form = await request.formData()
    const file = form.get("file")
    if (!file || typeof file === "string") {
      return NextResponse.json({ message: "Invalid input." }, { status: 400 })
    }
    const buffer = Buffer.from(await file.arrayBuffer())
    raw = buffer.toString("utf8")
    bundle = JSON.parse(raw) as Bundle
    await fs.writeFile(path.join(uploads, `${id}.bin`), buffer)
  }

  let normalized
  try {
    normalized = normalizeBundle(bundle)
  } catch {
    return NextResponse.json({ message: "Invalid input." }, { status: 400 })
  }

  await fs.writeFile(path.join(uploads, `${id}.json`), JSON.stringify(normalized, null, 2))
  return NextResponse.json({ id, bundle: normalized })
}

