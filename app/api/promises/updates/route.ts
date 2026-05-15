import { neon } from "@neondatabase/serverless"
import { NextRequest, NextResponse } from "next/server"
import { getAuth } from "@clerk/nextjs/server"

const sql = neon(process.env.DATABASE_URL!)

// Simple rate limiting (in-memory, resets on deploy)
const submissionCounts: Record<string, { count: number; resetTime: number }> = {}
const RATE_LIMIT_WINDOW = 24 * 60 * 60 * 1000 // 24 hours
const RATE_LIMIT_MAX = 5 // 5 submissions per day

function checkRateLimit(userId: string): { allowed: boolean; remaining: number } {
  const now = Date.now()
  const record = submissionCounts[userId]

  if (!record || now > record.resetTime) {
    submissionCounts[userId] = { count: 0, resetTime: now + RATE_LIMIT_WINDOW }
  }

  const current = submissionCounts[userId]
  if (current.count >= RATE_LIMIT_MAX) {
    return { allowed: false, remaining: 0 }
  }

  current.count++
  return { allowed: true, remaining: RATE_LIMIT_MAX - current.count }
}

// GET /api/promises/updates?promiseId=X - Get approved timeline updates for a promise
export async function GET(request: NextRequest) {
  try {
    const promiseId = request.nextUrl.searchParams.get("promiseId")

    if (!promiseId) {
      return NextResponse.json({ error: "Missing promiseId" }, { status: 400 })
    }

    const updates = await sql`
      SELECT id, title, link, description, created_at, submitted_by, user_email
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
    const { userId } = getAuth(request)

    // Require authentication
    if (!userId) {
      return NextResponse.json(
        { error: "You must be signed in to submit updates" },
        { status: 401 }
      )
    }

    // Rate limiting
    const rateLimit = checkRateLimit(userId)
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: "You have reached the maximum submissions (5 per day). Please try again tomorrow." },
        { status: 429 }
      )
    }

    const { promiseId, title, link, description, userName, userEmail } = await request.json()

    if (!promiseId || !title || !link) {
      return NextResponse.json(
        { error: "Missing promiseId, title, or link" },
        { status: 400 }
      )
    }

    const updateId = `${promiseId}-${Date.now()}`
    await sql`
      INSERT INTO timeline_updates (
        id, promise_id, title, link, description, status, 
        user_id, submitted_by, user_email
      )
      VALUES (
        ${updateId}, ${promiseId}, ${title}, ${link}, ${description || null}, 'pending',
        ${userId}, ${userName || "Anonymous"}, ${userEmail || null}
      )
    `

    return NextResponse.json(
      { 
        success: true, 
        id: updateId, 
        message: "Update submitted for review",
        remaining: rateLimit.remaining 
      },
      { status: 201 }
    )
  } catch (error) {
    console.error("[v0] Error submitting update:", error)
    return NextResponse.json({ error: "Failed to submit update" }, { status: 500 })
  }
}
