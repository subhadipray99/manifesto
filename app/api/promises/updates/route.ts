import { neon } from "@neondatabase/serverless"
import { NextRequest, NextResponse } from "next/server"
import { currentUser } from "@clerk/nextjs/server"

const getDb = () => neon(process.env.DATABASE_URL!)

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

// GET /api/promises/updates?promiseId=X&stateId=Y - Get approved timeline updates for a promise
export async function GET(request: NextRequest) {
  try {
    const promiseId = request.nextUrl.searchParams.get("promiseId")
    const stateId = request.nextUrl.searchParams.get("stateId") || "west-bengal"

    if (!promiseId) {
      return NextResponse.json({ error: "Missing promiseId" }, { status: 400 })
    }

    const updates = await getDb()`
      SELECT 
        id, 
        title, 
        link, 
        description, 
        created_at, 
        COALESCE(NULLIF(TRIM(submitted_by), ''), 'Community Member') as submitted_by,
        user_id
      FROM timeline_updates
      WHERE promise_id = ${promiseId} AND state_id = ${stateId} AND status = 'approved'
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
    // Always resolve user identity server-side from the Clerk session
    const clerkUser = await currentUser()

    if (!clerkUser) {
      return NextResponse.json(
        { error: "You must be signed in to submit updates" },
        { status: 401 }
      )
    }

    const userId = clerkUser.id
    const resolvedName =
      clerkUser.fullName ||
      [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(" ") ||
      clerkUser.username ||
      clerkUser.primaryEmailAddress?.emailAddress?.split("@")[0] ||
      "Community Member"

    const { promiseId, title, link, description, stateId = "west-bengal" } = await request.json()

    // Rate limiting
    const rateLimit = checkRateLimit(userId)
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: "You have reached the maximum submissions (5 per day). Please try again tomorrow." },
        { status: 429 }
      )
    }

    if (!promiseId || !title || !link) {
      return NextResponse.json(
        { error: "Missing promiseId, title, or link" },
        { status: 400 }
      )
    }

    const updateId = `${promiseId}-${Date.now()}`
    await getDb()`
      INSERT INTO timeline_updates (
        id, promise_id, title, link, description, status, 
        user_id, submitted_by, state_id
      )
      VALUES (
        ${updateId}, ${promiseId}, ${title}, ${link}, ${description || null}, 'pending',
        ${userId}, ${resolvedName}, ${stateId}
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
