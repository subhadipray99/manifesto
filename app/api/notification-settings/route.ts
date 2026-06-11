import { neon } from "@neondatabase/serverless"
import { NextRequest, NextResponse } from "next/server"
import { currentUser } from "@clerk/nextjs/server"

const getDb = () => neon(process.env.DATABASE_URL!)

// GET /api/notification-settings — get current user's notification preferences
export async function GET() {
  const user = await currentUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const db = getDb()
  const rows = await db`
    SELECT email_on_update_approved, email_on_reply, email_on_followed_update
    FROM notification_settings WHERE user_id = ${user.id} LIMIT 1
  `

  // Return defaults if no row yet
  if (rows.length === 0) {
    return NextResponse.json({
      email_on_update_approved: true,
      email_on_reply: true,
      email_on_followed_update: true,
    })
  }

  return NextResponse.json(rows[0])
}

// PATCH /api/notification-settings — update preferences
export async function PATCH(request: NextRequest) {
  const user = await currentUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await request.json()
  const {
    email_on_update_approved,
    email_on_reply,
    email_on_followed_update,
  } = body

  await getDb()`
    INSERT INTO notification_settings (user_id, email_on_update_approved, email_on_reply, email_on_followed_update, updated_at)
    VALUES (
      ${user.id},
      ${email_on_update_approved ?? true},
      ${email_on_reply ?? true},
      ${email_on_followed_update ?? true},
      NOW()
    )
    ON CONFLICT (user_id) DO UPDATE SET
      email_on_update_approved = EXCLUDED.email_on_update_approved,
      email_on_reply           = EXCLUDED.email_on_reply,
      email_on_followed_update = EXCLUDED.email_on_followed_update,
      updated_at               = NOW()
  `

  return NextResponse.json({ success: true })
}
