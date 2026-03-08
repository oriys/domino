import { NextResponse } from "next/server"

import {
  createDocCollection,
  listDocCollections,
  reorderDocCollections,
  DocCollectionNotFoundError,
} from "@/lib/api-platform/docs-server"

export async function GET() {
  try {
    const collections = await listDocCollections()
    return NextResponse.json(collections)
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()

    if (body._action === "reorder" && Array.isArray(body.orderedIds)) {
      const collections = await reorderDocCollections(body.orderedIds)
      return NextResponse.json(collections)
    }

    const collection = await createDocCollection(body)
    return NextResponse.json(collection, { status: 201 })
  } catch (error) {
    if (error instanceof DocCollectionNotFoundError) {
      return NextResponse.json({ error: error.message }, { status: 404 })
    }
    return NextResponse.json({ error: String(error) }, { status: 400 })
  }
}
