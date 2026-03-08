import { NextResponse } from "next/server"

import {
  createCategory,
  listCategories,
  reorderCategories,
  CategoryNotFoundError,
} from "@/lib/api-platform/docs-server"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const productId = searchParams.get("productId")
    if (!productId) {
      return NextResponse.json({ error: "productId query param is required" }, { status: 400 })
    }
    const cats = await listCategories(productId)
    return NextResponse.json(cats)
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()

    if (body._action === "reorder" && Array.isArray(body.orderedIds) && body.productId) {
      const cats = await reorderCategories(body.productId, body.orderedIds)
      return NextResponse.json(cats)
    }

    const category = await createCategory(body)
    return NextResponse.json(category, { status: 201 })
  } catch (error) {
    if (error instanceof CategoryNotFoundError) {
      return NextResponse.json({ error: error.message }, { status: 404 })
    }
    return NextResponse.json({ error: String(error) }, { status: 400 })
  }
}
