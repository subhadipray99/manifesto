import { neon } from "@neondatabase/serverless"
import { NextRequest, NextResponse } from "next/server"

const sql = neon(process.env.DATABASE_URL!)

// GET /api/admin/pending-updates - Get all pending submissions for moderation
export async function GET(request: NextRequest) {
  try {
    // Note: In production, you'd check admin status from Clerk JWT or database
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
