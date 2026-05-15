import { neon } from "@neondatabase/serverless"
import { NextResponse } from "next/server"

const sql = neon(process.env.DATABASE_URL!)

// GET /api/contributors - Get top contributors based on approved submissions
export async function GET() {
  try {
    const contributors = await sql`
      SELECT 
        submitted_by as name,
        COUNT(*) as contribution_count,
        MAX(created_at) as last_contribution
      FROM timeline_updates
      WHERE status = 'approved' AND submitted_by IS NOT NULL
      GROUP BY submitted_by
      ORDER BY contribution_count DESC, last_contribution DESC
      LIMIT 10
    `

    return NextResponse.json(contributors)
  } catch (error) {
    console.error("[v0] Error fetching contributors:", error)
    return NextResponse.json({ error: "Failed to fetch contributors" }, { status: 500 })
  }
}
