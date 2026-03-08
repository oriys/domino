import { NextResponse } from "next/server"

import { deleteExampleSet, getExampleSet, updateExampleSet } from "@/lib/api-platform/content-library"

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const set = await getExampleSet(id)
    if (!set) {
      return NextResponse.json({ error: "Example set not found." }, { status: 404 })
    }
    return NextResponse.json(set)
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await request.json()
    const set = await updateExampleSet(id, body)
    return NextResponse.json(set)
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 400 })
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    await deleteExampleSet(id)
    return new NextResponse(null, { status: 204 })
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 400 })
  }
}
