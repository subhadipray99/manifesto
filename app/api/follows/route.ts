import { neon } from "@neondatabase/serverless"
import { NextRequest, NextResponse } from "next/server"
import { currentUser } from "@clerk/nextjs/server"

const getDb = () => neon(process.env.DATABASE_URL!)

// GET /api/follows?promiseId=X  — check if current user follows a promise
// GET /api/follows               — get all promise IDs the current user follows
export async function GET(request: NextRequest) {
  const user = await currentUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const promiseId = request.nextUrl.searchParams.get("promiseId")
  const db = getDb()

  if (promiseId) {
    const rows = await db`
      SELECT 1 FROM promise_follows WHERE user_id = ${user.id} AND promise_id = ${promiseId} LIMIT 1
    `
    return NextResponse.json({ following: rows.length > 0 })
  }

  const rows = await db`
    SELECT f.promise_id, f.state_id, p.title as promise_title
    FROM promise_follows f
    LEFT JOIN promises p ON p.id = f.promise_id
    WHERE f.user_id = ${user.id}
    ORDER BY f.created_at DESC
  `
  return NextResponse.json({ follows: rows })
}

// POST /api/follows — follow a promise
export async function POST(request: NextRequest) {
  const user = await currentUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { promiseId, stateId } = await request.json()
  if (!promiseId || !stateId) return NextResponse.json({ error: "Missing promiseId or stateId" }, { status: 400 })

  await getDb()`
    INSERT INTO promise_follows (user_id, promise_id, state_id)
    VALUES (${user.id}, ${promiseId}, ${stateId})
    ON CONFLICT (user_id, promise_id) DO NOTHING
  `
  return NextResponse.json({ success: true, following: true })
}

// DELETE /api/follows — unfollow a promise
export async function DELETE(request: NextRequest) {
  const user = await currentUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const promiseId = request.nextUrl.searchParams.get("promiseId")
  if (!promiseId) return NextResponse.json({ error: "Missing promiseId" }, { status: 400 })

  await getDb()`
    DELETE FROM promise_follows WHERE user_id = ${user.id} AND promise_id = ${promiseId}
  `
  return NextResponse.json({ success: true, following: false })
}
