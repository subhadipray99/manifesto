import { neon } from "@neondatabase/serverless"
import { NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"

const getDb = () => neon(process.env.DATABASE_URL!)

export async function POST(request: Request) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Verify admin status using environment variables (consistent with rest of app)
    const adminIds = process.env.ADMIN_USER_IDS?.split(",").map((id) => id.trim()) || []
    if (!adminIds.includes(userId)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    const db = getDb()

    const { type, headline, body, url, url_text, is_active } = await request.json()

    if (!headline) {
      return NextResponse.json({ error: "Headline is required" }, { status: 400 })
    }

    // Deactivate all existing notices first if this one is active
    if (is_active) {
      await db`UPDATE notices SET is_active = false`
    }

    // Insert new notice
    const result = await db`
      INSERT INTO notices (type, headline, body, url, url_text, is_active, updated_at)
      VALUES (${type || 'NOTICE'}, ${headline}, ${body || null}, ${url || null}, ${url_text || null}, ${is_active !== false}, NOW())
      RETURNING *
    `

    return NextResponse.json({ success: true, notice: result[0] })
  } catch (error) {
    console.error("Error creating notice:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Verify admin status using environment variables (consistent with rest of app)
    const adminIds = process.env.ADMIN_USER_IDS?.split(",").map((id) => id.trim()) || []
    if (!adminIds.includes(userId)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    const db = getDb()

    const { id, is_active } = await request.json()

    if (!id) {
      return NextResponse.json({ error: "ID is required" }, { status: 400 })
    }

    const result = await db`
      UPDATE notices
      SET is_active = ${is_active}, updated_at = NOW()
      WHERE id = ${id}
      RETURNING *
    `

    return NextResponse.json({ success: true, notice: result[0] })
  } catch (error) {
    console.error("Error updating notice:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
