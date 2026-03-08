import { NextResponse } from "next/server"

import { listProductTrees, getProductTree } from "@/lib/api-platform/docs-server"
import { bootstrapSampleProducts } from "@/lib/api-platform/sample-docs"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const productId = searchParams.get("productId")

    if (productId) {
      const tree = await getProductTree(productId)
      return NextResponse.json(tree)
    }

    let trees = await listProductTrees()
    if (trees.length === 0) {
      await bootstrapSampleProducts()
      trees = await listProductTrees()
    }
    return NextResponse.json(trees)
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
