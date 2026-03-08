import { NextResponse } from "next/server"

import { createExampleSet, listResolvedExampleSets } from "@/lib/api-platform/content-library"

function getActor(request: Request) {
  return request.headers.get("X-User-Id") ?? undefined
}

export async function GET() {
  try {
    const sets = await listResolvedExampleSets()
    return NextResponse.json(sets)
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const set = await createExampleSet(body, getActor(request))
    return NextResponse.json(set, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 400 })
  }
}
