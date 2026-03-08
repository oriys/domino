import { NextResponse } from "next/server"

import { createReusableSnippet, listReusableSnippets } from "@/lib/api-platform/content-library"

function getActor(request: Request) {
  return request.headers.get("X-User-Id") ?? undefined
}

export async function GET() {
  try {
    const snippets = await listReusableSnippets()
    return NextResponse.json(snippets)
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const snippet = await createReusableSnippet(body, getActor(request))
    return NextResponse.json(snippet, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 400 })
  }
}
