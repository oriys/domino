import { NextRequest, NextResponse } from "next/server"

import { deleteGlossaryTerm, getGlossaryTermById, updateGlossaryTerm } from "@/lib/api-platform/glossary"

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const term = await getGlossaryTermById(id)
    if (!term) return NextResponse.json({ error: "Not found" }, { status: 404 })
    return NextResponse.json(term)
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await request.json()
    const actor = request.headers.get("X-User-Id") ?? undefined
    const term = await updateGlossaryTerm(id, body, actor)
    return NextResponse.json(term)
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 400 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const actor = request.headers.get("X-User-Id") ?? undefined
    await deleteGlossaryTerm(id, actor)
    return new NextResponse(null, { status: 204 })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
