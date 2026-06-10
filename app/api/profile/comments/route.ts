import { neon } from "@neondatabase/serverless"
import { NextRequest, NextResponse } from "next/server"
import { resolveUserId } from "@/lib/usernames"

const getDb = () => neon(process.env.DATABASE_URL!)

// GET /api/profile/comments?userId=X&sort=date|promise
export async function GET(request: NextRequest) {
  try {
    const identifier = request.nextUrl.searchParams.get("userId")
    const sort = request.nextUrl.searchParams.get("sort") || "date"

    if (!identifier) {
      return NextResponse.json({ error: "Missing userId" }, { status: 400 })
    }

    const userId = await resolveUserId(identifier)
    if (!userId) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const db = getDb()

    const rows = sort === "promise"
      ? await db`
          SELECT
            c.id,
            c.body,
            c.created_at,
            c.upvotes,
            c.downvotes,
            c.promise_id,
            c.state_id,
            c.parent_id,
            p.title            AS promise_title,
            cat.name           AS category_name,
            cat.color          AS category_color,
            cat.icon           AS category_icon,
            s.name             AS state_name
          FROM comments c
          LEFT JOIN promises   p   ON p.id  = c.promise_id
          LEFT JOIN categories cat ON cat.id = p.category_id
          LEFT JOIN states     s   ON s.id  = c.state_id
          WHERE c.user_id = ${userId}
          ORDER BY p.title ASC, c.created_at DESC
          LIMIT 50
        `
      : await db`
          SELECT
            c.id,
            c.body,
            c.created_at,
            c.upvotes,
            c.downvotes,
            c.promise_id,
            c.state_id,
            c.parent_id,
            p.title            AS promise_title,
            cat.name           AS category_name,
            cat.color          AS category_color,
            cat.icon           AS category_icon,
            s.name             AS state_name
          FROM comments c
          LEFT JOIN promises   p   ON p.id  = c.promise_id
          LEFT JOIN categories cat ON cat.id = p.category_id
          LEFT JOIN states     s   ON s.id  = c.state_id
          WHERE c.user_id = ${userId}
          ORDER BY c.created_at DESC
          LIMIT 50
        `

    return NextResponse.json({ comments: rows })
  } catch (error) {
    console.error("[v0] profile comments error:", error)
    return NextResponse.json({ error: "Failed to fetch comments" }, { status: 500 })
  }
}
