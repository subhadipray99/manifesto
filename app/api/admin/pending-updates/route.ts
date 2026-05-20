import { neon } from "@neondatabase/serverless"
import { NextRequest, NextResponse } from "next/server"

const getDb = () => neon(process.env.DATABASE_URL!)

// Helper to check if user is admin
function isAdmin(userId: string | null): boolean {
  if (!userId) return false
  const adminIds = process.env.ADMIN_USER_IDS?.split(",").map((id) => id.trim()) || []
  return adminIds.includes(userId)
}

// GET /api/admin/pending-updates?userId=X&status=pending - Get submissions by status
export async function GET(request: NextRequest) {
  try {
    const userId = request.nextUrl.searchParams.get("userId")
    const status = request.nextUrl.searchParams.get("status") || "pending"

    if (!isAdmin(userId)) {
      return NextResponse.json({ error: "Unauthorized - Admin access required" }, { status: 403 })
    }

    const updates = status === "pending"
      ? await getDb()`
          SELECT 
            tu.id, tu.promise_id, tu.title, tu.link, tu.description,
            tu.submitted_by, tu.user_email, tu.created_at, tu.status,
            ps.status as promise_status
          FROM timeline_updates tu
          LEFT JOIN promise_statuses ps ON tu.promise_id = ps.id
          WHERE tu.status = ${status}
          ORDER BY tu.created_at ASC
        `
      : await getDb()`
          SELECT 
            tu.id, tu.promise_id, tu.title, tu.link, tu.description,
            tu.submitted_by, tu.user_email, tu.created_at, tu.status,
            ps.status as promise_status
          FROM timeline_updates tu
          LEFT JOIN promise_statuses ps ON tu.promise_id = ps.id
          WHERE tu.status = ${status}
          ORDER BY tu.created_at DESC
        `

    return NextResponse.json(updates)
  } catch (error) {
    console.error("[v0] Error fetching updates:", error)
    return NextResponse.json({ error: "Failed to fetch updates" }, { status: 500 })
  }
}

// PUT /api/admin/pending-updates - Approve or reject an update
export async function PUT(request: NextRequest) {
  try {
    const { updateId, action, userId } = await request.json()

    if (!isAdmin(userId)) {
      return NextResponse.json({ error: "Unauthorized - Admin access required" }, { status: 403 })
    }

    if (!updateId || !["approve", "reject"].includes(action)) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 })
    }

    const newStatus = action === "approve" ? "approved" : "rejected"

    await getDb()`
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

// PATCH /api/admin/pending-updates - Edit an update's content
export async function PATCH(request: NextRequest) {
  try {
    const { updateId, title, link, description, userId } = await request.json()

    if (!isAdmin(userId)) {
      return NextResponse.json({ error: "Unauthorized - Admin access required" }, { status: 403 })
    }

    if (!updateId || !title || !link) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    await getDb()`
      UPDATE timeline_updates
      SET title = ${title}, link = ${link}, description = ${description || null}
      WHERE id = ${updateId}
    `

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] Error editing submission:", error)
    return NextResponse.json({ error: "Failed to edit submission" }, { status: 500 })
  }
}
