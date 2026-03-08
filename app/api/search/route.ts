import { NextResponse } from "next/server"

import { searchAll } from "@/lib/api-platform/docs-server"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const q = searchParams.get("q") ?? ""

    if (!q.trim()) {
      return NextResponse.json([])
    }

    const results = await searchAll(q)
    return NextResponse.json(results)
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
