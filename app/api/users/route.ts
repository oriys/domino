import { NextResponse } from "next/server"

import { listUsers } from "@/lib/api-platform/users"

export async function GET() {
  try {
    const data = await listUsers()
    return NextResponse.json(data)
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
