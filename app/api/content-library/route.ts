import { NextResponse } from "next/server"

import { getContentLibrarySnapshot } from "@/lib/api-platform/content-library"

export async function GET() {
  try {
    const snapshot = await getContentLibrarySnapshot()
    return NextResponse.json(snapshot)
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
