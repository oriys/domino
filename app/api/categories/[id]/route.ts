import { NextResponse } from "next/server"

import {
  deleteCategory,
  getCategoryById,
  updateCategory,
  CategoryNotFoundError,
} from "@/lib/api-platform/docs-server"

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const category = await getCategoryById(id)
    return NextResponse.json(category)
  } catch (error) {
    if (error instanceof CategoryNotFoundError) {
      return NextResponse.json({ error: error.message }, { status: 404 })
    }
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await request.json()
    const category = await updateCategory(id, body)
    return NextResponse.json(category)
  } catch (error) {
    if (error instanceof CategoryNotFoundError) {
      return NextResponse.json({ error: error.message }, { status: 404 })
    }
    return NextResponse.json({ error: String(error) }, { status: 400 })
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    await deleteCategory(id)
    return new NextResponse(null, { status: 204 })
  } catch (error) {
    if (error instanceof CategoryNotFoundError) {
      return NextResponse.json({ error: error.message }, { status: 404 })
    }
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
