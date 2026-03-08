import { NextResponse } from "next/server"

import {
  createProduct,
  listProducts,
  reorderProducts,
  ProductNotFoundError,
} from "@/lib/api-platform/docs-server"

export async function GET() {
  try {
    const products = await listProducts()
    return NextResponse.json(products)
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()

    if (body._action === "reorder" && Array.isArray(body.orderedIds)) {
      const products = await reorderProducts(body.orderedIds)
      return NextResponse.json(products)
    }

    const product = await createProduct(body)
    return NextResponse.json(product, { status: 201 })
  } catch (error) {
    if (error instanceof ProductNotFoundError) {
      return NextResponse.json({ error: error.message }, { status: 404 })
    }
    return NextResponse.json({ error: String(error) }, { status: 400 })
  }
}
