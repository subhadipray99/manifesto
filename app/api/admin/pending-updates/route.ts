import { neon } from "@neondatabase/serverless"
import { NextRequest, NextResponse } from "next/server"
import { clerkClient } from "@clerk/nextjs/server"
import { sendUpdateApprovedEmail, sendFollowedPromiseUpdateEmail, isEmailEnabled } from "@/lib/email"

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
            tu.submitted_by, tu.user_email, tu.created_at, tu.status, tu.impact,
            ps.status as promise_status
          FROM timeline_updates tu
          LEFT JOIN promise_statuses ps ON tu.promise_id = ps.id
          WHERE tu.status = ${status}
          ORDER BY tu.created_at ASC
        `
      : await getDb()`
          SELECT 
            tu.id, tu.promise_id, tu.title, tu.link, tu.description,
            tu.submitted_by, tu.user_email, tu.created_at, tu.status, tu.impact,
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

    const [update] = await getDb()`
      UPDATE timeline_updates
      SET status = ${newStatus}
      WHERE id = ${updateId}
      RETURNING user_id, user_email, submitted_by, title, promise_id, state_id
    `

    // Send approval email (best-effort, non-blocking)
    if (action === "approve" && update) {
      try {
        // Prefer stored email; fall back to fetching from Clerk
        let toEmail = update.user_email as string | null
        let recipientName = update.submitted_by as string || "Contributor"

        if (!toEmail && update.user_id) {
          const client = await clerkClient()
          const clerkUser = await client.users.getUser(update.user_id as string)
          toEmail = clerkUser.emailAddresses?.[0]?.emailAddress ?? null
          recipientName = clerkUser.fullName || clerkUser.firstName || recipientName
        }

        const [promise] = await getDb()`
          SELECT title FROM promises WHERE id = ${update.promise_id} LIMIT 1
        `
        const promiseTitle = promise?.title ?? update.promise_id as string

        if (toEmail) {
          await sendUpdateApprovedEmail({
            toEmail,
            recipientName,
            updateTitle: update.title as string,
            promiseTitle,
            stateId: update.state_id as string || "west-bengal",
            promiseId: update.promise_id as string,
          })
        }

        // Fan-out email to all followers of this promise
        try {
          const followers = await getDb()`
            SELECT user_id FROM promise_follows WHERE promise_id = ${update.promise_id}
          `
          const client = await clerkClient()
          for (const follower of followers) {
            // Don't double-email the submitter
            if (follower.user_id === update.user_id) continue
            try {
              const enabled = await isEmailEnabled(follower.user_id as string, "email_on_followed_update")
              if (!enabled) continue
              const followerUser = await client.users.getUser(follower.user_id as string)
              const followerEmail = followerUser.emailAddresses?.[0]?.emailAddress
              if (!followerEmail) continue
              await sendFollowedPromiseUpdateEmail({
                toEmail: followerEmail,
                recipientName: followerUser.fullName || followerUser.firstName || "Follower",
                promiseTitle,
                updateTitle: update.title as string,
                submittedBy: update.submitted_by as string || "Community Member",
                stateId: update.state_id as string || "west-bengal",
                promiseId: update.promise_id as string,
              })
            } catch { /* skip this follower */ }
          }
        } catch (fanOutErr) {
          console.error("[v0] Follower fan-out failed:", fanOutErr)
        }
      } catch (emailErr) {
        console.error("[v0] Email notification failed:", emailErr)
      }
    }

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
