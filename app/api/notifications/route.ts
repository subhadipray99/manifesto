import { neon } from "@neondatabase/serverless"
import { NextRequest, NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"

const getDb = () => neon(process.env.DATABASE_URL!)

// GET /api/notifications — list notifications for the signed-in user
export async function GET(request: NextRequest) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const limit = Math.min(Number(searchParams.get("limit") ?? 30), 50)

  const db = getDb()

  const [rows, countRows] = await Promise.all([
    db`
      SELECT id, type, comment_id, parent_comment_id, promise_id, state_id,
             promise_title, actor_name, actor_user_id, body_preview, is_read, created_at
      FROM notifications
      WHERE recipient_user_id = ${userId}
      ORDER BY created_at DESC
      LIMIT ${limit}
    `,
    db`
      SELECT COUNT(*) as count
      FROM notifications
      WHERE recipient_user_id = ${userId} AND is_read = FALSE
    `,
  ])

  return NextResponse.json({
    notifications: rows,
    unreadCount: Number(countRows[0]?.count ?? 0),
  })
}

// PATCH /api/notifications — mark one or all as read
export async function PATCH(request: NextRequest) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await request.json().catch(() => ({}))
  const db = getDb()

  if (body.id) {
    // Mark a single notification as read
    await db`
      UPDATE notifications
      SET is_read = TRUE
      WHERE id = ${body.id} AND recipient_user_id = ${userId}
    `
  } else {
    // Mark all as read
    await db`
      UPDATE notifications
      SET is_read = TRUE
      WHERE recipient_user_id = ${userId} AND is_read = FALSE
    `
  }

  return NextResponse.json({ ok: true })
}
