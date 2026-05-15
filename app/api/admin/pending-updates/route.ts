import { neon } from "@neondatabase/serverless"
import { NextRequest, NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"

const sql = neon(process.env.DATABASE_URL!)

// Helper to check if user is admin
function isAdmin(userId: string | null): boolean {
  if (!userId) return false
  const adminIds = process.env.ADMIN_USER_IDS?.split(",").map((id) => id.trim()) || []
  return adminIds.includes(userId)
}

// GET /api/admin/pending-updates - Get all pending submissions for moderation
export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth()

    if (!isAdmin(userId)) {
      return NextResponse.json({ error: "Unauthorized - Admin access required" }, { status: 403 })
    }

    const updates = await sql`
      SELECT 
        tu.id, tu.promise_id, tu.title, tu.link, tu.description,
        tu.submitted_by, tu.user_email, tu.created_at, tu.status,
        ps.status as promise_status
      FROM timeline_updates tu
      LEFT JOIN promise_statuses ps ON tu.promise_id = ps.id
      WHERE tu.status = 'pending'
      ORDER BY tu.created_at ASC
    `

    return NextResponse.json(updates)
  } catch (error) {
    console.error("[v0] Error fetching pending updates:", error)
    return NextResponse.json({ error: "Failed to fetch updates" }, { status: 500 })
  }
}

// PUT /api/admin/pending-updates - Approve or reject an update
export async function PUT(request: NextRequest) {
  try {
    const { userId } = await auth()

    if (!isAdmin(userId)) {
      return NextResponse.json({ error: "Unauthorized - Admin access required" }, { status: 403 })
    }

    const { updateId, action } = await request.json()

    if (!updateId || !["approve", "reject"].includes(action)) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 })
    }

    const newStatus = action === "approve" ? "approved" : "rejected"

    await sql`
      UPDATE timeline_updates
      SET status = ${newStatus}
      WHERE id = ${updateId}
    `

    return NextResponse.json({ success: true, message: `Update ${action}ed` })
  } catch (error) {
    console.error("[v0] Error updating submission:", error)
    return NextResponse.json({ error: "Failed to update submission" }, { status: 500 })
  }
}
