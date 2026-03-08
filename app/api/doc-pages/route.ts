import { NextResponse } from "next/server"

import {
  createDocPage,
  listDocPages,
  reorderDocPages,
  DocPageNotFoundError,
} from "@/lib/api-platform/docs-server"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const categoryId = searchParams.get("categoryId")
    if (!categoryId) {
      return NextResponse.json({ error: "categoryId query param is required" }, { status: 400 })
    }
    const pages = await listDocPages(categoryId)
    return NextResponse.json(pages)
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()

    if (body._action === "reorder" && Array.isArray(body.orderedIds) && body.categoryId) {
      const pages = await reorderDocPages(body.categoryId, body.orderedIds)
      return NextResponse.json(pages)
    }

    const page = await createDocPage(body)
    return NextResponse.json(page, { status: 201 })
  } catch (error) {
    if (error instanceof DocPageNotFoundError) {
      return NextResponse.json({ error: error.message }, { status: 404 })
    }
    return NextResponse.json({ error: String(error) }, { status: 400 })
  }
}
