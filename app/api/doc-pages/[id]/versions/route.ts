import { NextResponse } from "next/server"

import { listDocPageVersions, getDocPageVersion } from "@/lib/api-platform/docs-server"

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const { searchParams } = new URL(request.url)
    const versionId = searchParams.get("versionId")

    if (versionId) {
      const version = await getDocPageVersion(versionId)
      return NextResponse.json(version)
    }

    const versions = await listDocPageVersions(id)
    return NextResponse.json(versions)
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
