import { NextResponse } from "next/server"

import {
  deleteDocPage,
  getDocPageById,
  updateDocPage,
  updateDocPageContent,
  publishDocPage,
  unpublishDocPage,
  DocPageNotFoundError,
} from "@/lib/api-platform/docs-server"
import { hasPermission } from "@/lib/api-platform/types"
import { getUserById } from "@/lib/api-platform/users"

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const page = await getDocPageById(id)
    return NextResponse.json(page)
  } catch (error) {
    if (error instanceof DocPageNotFoundError) {
      return NextResponse.json({ error: error.message }, { status: 404 })
    }
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await request.json()
    const actor = request.headers.get("X-User-Id") ?? body.actorId ?? undefined

    if (body._action === "updateContent" && typeof body.content === "string") {
      const page = await updateDocPageContent(id, body.content)
      return NextResponse.json(page)
    }

    if (body._action === "publish" || body._action === "unpublish") {
      const actorUser = actor ? await getUserById(actor) : null
      if (actorUser && !hasPermission(actorUser.role, "canPublish")) {
        return NextResponse.json({ error: "You don't have permission to publish documentation." }, { status: 403 })
      }
    }

    if (body._action === "publish") {
      const page = await publishDocPage(id, body.changelog, actor)
      return NextResponse.json(page)
    }

    if (body._action === "unpublish") {
      const page = await unpublishDocPage(id, actor)
      return NextResponse.json(page)
    }

    const page = await updateDocPage(id, body)
    return NextResponse.json(page)
  } catch (error) {
    if (error instanceof DocPageNotFoundError) {
      return NextResponse.json({ error: error.message }, { status: 404 })
    }
    return NextResponse.json({ error: String(error) }, { status: 400 })
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    await deleteDocPage(id)
    return new NextResponse(null, { status: 204 })
  } catch (error) {
    if (error instanceof DocPageNotFoundError) {
      return NextResponse.json({ error: error.message }, { status: 404 })
    }
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
