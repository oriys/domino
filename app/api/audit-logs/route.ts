import { NextResponse } from "next/server"

import { listAuditLogs } from "@/lib/api-platform/audit"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const limitStr = searchParams.get("limit")
    const limit = limitStr ? parseInt(limitStr, 10) : 100

    const logs = await listAuditLogs(limit)
    return NextResponse.json(logs)
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
