import { NextResponse } from "next/server"

import { deleteReusableSnippet, getReusableSnippet, updateReusableSnippet } from "@/lib/api-platform/content-library"

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const snippet = await getReusableSnippet(id)
    if (!snippet) {
      return NextResponse.json({ error: "Snippet not found." }, { status: 404 })
    }
    return NextResponse.json(snippet)
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await request.json()
    const snippet = await updateReusableSnippet(id, body)
    return NextResponse.json(snippet)
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 400 })
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    await deleteReusableSnippet(id)
    return new NextResponse(null, { status: 204 })
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 400 })
  }
}
