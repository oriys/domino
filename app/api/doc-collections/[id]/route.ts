import { NextResponse } from "next/server"

import {
  deleteDocCollection,
  getCollectionById,
  updateDocCollection,
  DocCollectionNotFoundError,
} from "@/lib/api-platform/docs-server"

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const collection = await getCollectionById(id)
    return NextResponse.json(collection)
  } catch (error) {
    if (error instanceof DocCollectionNotFoundError) {
      return NextResponse.json({ error: error.message }, { status: 404 })
    }
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await request.json()
    const collection = await updateDocCollection(id, body)
    return NextResponse.json(collection)
  } catch (error) {
    if (error instanceof DocCollectionNotFoundError) {
      return NextResponse.json({ error: error.message }, { status: 404 })
    }
    return NextResponse.json({ error: String(error) }, { status: 400 })
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    await deleteDocCollection(id)
    return new NextResponse(null, { status: 204 })
  } catch (error) {
    if (error instanceof DocCollectionNotFoundError) {
      return NextResponse.json({ error: error.message }, { status: 404 })
    }
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
