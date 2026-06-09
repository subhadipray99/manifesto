import { neon } from "@neondatabase/serverless"
import { NextRequest, NextResponse } from "next/server"

const getDb = () => neon(process.env.DATABASE_URL!)

// GET /api/contributors?stateId=X - Get top contributors based on approved submissions
export async function GET(request: NextRequest) {
  try {
    const stateId = request.nextUrl.searchParams.get("stateId") || "west-bengal"
    
    const contributors = await getDb()`
      SELECT 
        t.submitted_by as name,
        MAX(t.user_id) as user_id,
        MAX(u.username) as username,
        COUNT(*) as contribution_count,
        MAX(t.created_at) as last_contribution
      FROM timeline_updates t
      LEFT JOIN usernames u ON u.user_id = t.user_id
      WHERE t.status = 'approved' AND t.submitted_by IS NOT NULL AND t.state_id = ${stateId}
      GROUP BY t.submitted_by
      ORDER BY contribution_count DESC, last_contribution DESC
      LIMIT 10
    `

    return NextResponse.json(contributors)
  } catch (error) {
    console.error("[v0] Error fetching contributors:", error)
    return NextResponse.json({ error: "Failed to fetch contributors" }, { status: 500 })
  }
}
