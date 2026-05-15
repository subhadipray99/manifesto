import { neon } from "@neondatabase/serverless"
import { NextRequest, NextResponse } from "next/server"

const sql = neon(process.env.DATABASE_URL!)

// GET /api/promises/updates?promiseId=X - Get approved timeline updates for a promise
export async function GET(request: NextRequest) {
  try {
    const promiseId = request.nextUrl.searchParams.get("promiseId")

    if (!promiseId) {
      return NextResponse.json({ error: "Missing promiseId" }, { status: 400 })
    }

    const updates = await sql`
      SELECT id, title, link, description, created_at
      FROM timeline_updates
      WHERE promise_id = ${promiseId} AND status = 'approved'
      ORDER BY created_at DESC
    `

    return NextResponse.json(updates)
  } catch (error) {
    console.error("[v0] Error fetching updates:", error)
    return NextResponse.json({ error: "Failed to fetch updates" }, { status: 500 })
  }
}

// POST /api/promises/updates - Submit a new timeline update (goes to pending)
export async function POST(request: NextRequest) {
  try {
    const { promiseId, title, link, description } = await request.json()

    if (!promiseId || !title || !link) {
      return NextResponse.json(
        { error: "Missing promiseId, title, or link" },
        { status: 400 }
      )
    }

    const updateId = `${promiseId}-${Date.now()}`
    await sql`
      INSERT INTO timeline_updates (id, promise_id, title, link, description, status)
      VALUES (${updateId}, ${promiseId}, ${title}, ${link}, ${description || null}, 'pending')
    `

    return NextResponse.json(
      { success: true, id: updateId, message: "Update submitted for review" },
      { status: 201 }
    )
  } catch (error) {
    console.error("[v0] Error submitting update:", error)
    return NextResponse.json({ error: "Failed to submit update" }, { status: 500 })
  }
}
