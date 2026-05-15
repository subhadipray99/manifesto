import { neon } from "@neondatabase/serverless"
import { NextRequest, NextResponse } from "next/server"

const sql = neon(process.env.DATABASE_URL!)

// Helper to check if user is admin
function isAdmin(userId: string | null): boolean {
  if (!userId) return false
  const adminIds = process.env.ADMIN_USER_IDS?.split(",").map((id) => id.trim()) || []
  return adminIds.includes(userId)
}

// GET /api/promises/statuses - Get all promise statuses
export async function GET() {
  try {
    const statuses = await sql`SELECT id, status, updated_at FROM promise_statuses`
    const result: Record<string, string> = {}
    statuses.forEach((row: any) => {
      result[row.id] = row.status
    })
    return NextResponse.json(result)
  } catch (error) {
    console.error("[v0] Error fetching statuses:", error)
    return NextResponse.json({ error: "Failed to fetch statuses" }, { status: 500 })
  }
}

// PUT /api/promises/statuses - Update a promise status (admin only)
export async function PUT(request: NextRequest) {
  try {
    const { promiseId, status, userId } = await request.json()

    if (!isAdmin(userId)) {
      return NextResponse.json(
        { error: "Only admins can change promise statuses" },
        { status: 403 }
      )
    }

    if (!promiseId || !status) {
      return NextResponse.json({ error: "Missing promiseId or status" }, { status: 400 })
    }

    await sql`
      UPDATE promise_statuses
      SET status = ${status}, updated_at = CURRENT_TIMESTAMP
      WHERE id = ${promiseId}
    `

    return NextResponse.json({ success: true, promiseId, status })
  } catch (error) {
    console.error("[v0] Error updating status:", error)
    return NextResponse.json({ error: "Failed to update status" }, { status: 500 })
  }
}
