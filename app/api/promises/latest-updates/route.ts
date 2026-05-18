import { neon } from "@neondatabase/serverless"
import { NextRequest, NextResponse } from "next/server"

const sql = neon(process.env.DATABASE_URL!)

// GET /api/promises/latest-updates?stateId=X - Get 7 most recently approved timeline updates
export async function GET(request: NextRequest) {
  try {
    const stateId = request.nextUrl.searchParams.get("stateId") || "west-bengal"
    
    const updates = await sql`
      SELECT id, promise_id, title, link, description, submitted_by, created_at
      FROM timeline_updates
      WHERE status = 'approved' AND state_id = ${stateId}
      ORDER BY created_at DESC
      LIMIT 7
    `

    return NextResponse.json(updates)
  } catch (error) {
    console.error("[v0] Error fetching latest updates:", error)
    return NextResponse.json({ error: "Failed to fetch latest updates" }, { status: 500 })
  }
}
