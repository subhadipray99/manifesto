import { neon } from "@neondatabase/serverless"
import { NextResponse } from "next/server"

const sql = neon(process.env.DATABASE_URL!)

// GET /api/promises/latest-updates - Get 5 most recently approved timeline updates
export async function GET() {
  try {
    const updates = await sql`
      SELECT id, promise_id, title, link, description, submitted_by, created_at
      FROM timeline_updates
      WHERE status = 'approved'
      ORDER BY created_at DESC
      LIMIT 5
    `

    return NextResponse.json(updates)
  } catch (error) {
    console.error("[v0] Error fetching latest updates:", error)
    return NextResponse.json({ error: "Failed to fetch latest updates" }, { status: 500 })
  }
}
