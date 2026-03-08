import { NextRequest, NextResponse } from "next/server"

import { createGlossaryTerm, listGlossaryTerms } from "@/lib/api-platform/glossary"

export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  try {
    const search = request.nextUrl.searchParams.get("q") ?? undefined
    const terms = await listGlossaryTerms(search)
    return NextResponse.json(terms)
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const actor = request.headers.get("X-User-Id") ?? undefined
    const term = await createGlossaryTerm(body, actor)
    return NextResponse.json(term, { status: 201 })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 400 })
  }
}
