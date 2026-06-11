import { neon } from "@neondatabase/serverless"
import { NextRequest, NextResponse } from "next/server"
import { currentUser, clerkClient } from "@clerk/nextjs/server"
import { ensureUsername } from "@/lib/usernames"
import { sendReplyNotificationEmail, isEmailEnabled } from "@/lib/email"

const getDb = () => neon(process.env.DATABASE_URL!)

function isAdmin(userId: string | null): boolean {
  if (!userId) return false
  const adminIds = process.env.ADMIN_USER_IDS?.split(",").map((id) => id.trim()) || []
  return adminIds.includes(userId)
}

function resolveName(user: any): string {
  return (
    user.fullName ||
    [user.firstName, user.lastName].filter(Boolean).join(" ") ||
    user.username ||
    user.primaryEmailAddress?.emailAddress?.split("@")[0] ||
    "Community Member"
  )
}

// GET /api/promises/comments?promiseId=X&stateId=Y - List comments for a promise
export async function GET(request: NextRequest) {
  try {
    const promiseId = request.nextUrl.searchParams.get("promiseId")
    const stateId = request.nextUrl.searchParams.get("stateId") || "west-bengal"

    if (!promiseId) {
      return NextResponse.json({ error: "Missing promiseId" }, { status: 400 })
    }

    const db = getDb()
    const rows = await db`
      SELECT c.id, c.promise_id, c.state_id, c.parent_id, c.body, c.user_id, c.author_name,
             c.upvotes, c.downvotes, c.created_at, u.username
      FROM comments c
      LEFT JOIN usernames u ON u.user_id = c.user_id
      WHERE c.promise_id = ${promiseId} AND c.state_id = ${stateId}
      ORDER BY c.created_at ASC
    `

    // Attach the current user's votes (if signed in)
    const user = await currentUser()
    let voteMap: Record<string, number> = {}
    if (user) {
      const votes = await db`
        SELECT comment_id, vote FROM comment_votes WHERE user_id = ${user.id}
      `
      voteMap = Object.fromEntries(votes.map((v: any) => [v.comment_id, v.vote]))
    }

    // Batch-fetch Clerk profile images for all unique user_ids
    const uniqueUserIds = [...new Set(rows.map((c: any) => c.user_id).filter(Boolean))] as string[]
    const avatarMap: Record<string, string> = {}
    if (uniqueUserIds.length > 0) {
      try {
        const client = await clerkClient()
        await Promise.all(
          uniqueUserIds.map(async (uid) => {
            try {
              const u = await client.users.getUser(uid)
              if (u.imageUrl) avatarMap[uid] = u.imageUrl
            } catch { /* skip */ }
          })
        )
      } catch { /* skip avatar enrichment */ }
    }

    const comments = rows.map((c: any) => ({
      ...c,
      score: (c.upvotes || 0) - (c.downvotes || 0),
      userVote: voteMap[c.id] || 0,
      image_url: avatarMap[c.user_id] || null,
    }))

    return NextResponse.json({ comments })
  } catch (error) {
    console.error("[v0] Error fetching comments:", error)
    return NextResponse.json({ error: "Failed to fetch comments" }, { status: 500 })
  }
}

// POST /api/promises/comments - Create a comment or reply
export async function POST(request: NextRequest) {
  try {
    const user = await currentUser()
    if (!user) {
      return NextResponse.json({ error: "You must be signed in to comment" }, { status: 401 })
    }

    const { promiseId, stateId = "west-bengal", body, parentId } = await request.json()

    if (!promiseId || !body || !body.trim()) {
      return NextResponse.json({ error: "Missing promiseId or comment body" }, { status: 400 })
    }
    if (body.trim().length > 2000) {
      return NextResponse.json({ error: "Comment is too long (max 2000 characters)" }, { status: 400 })
    }

    const db = getDb()

    // Validate parent exists if this is a reply
    if (parentId) {
      const parent = await db`SELECT id FROM comments WHERE id = ${parentId}`
      if (parent.length === 0) {
        return NextResponse.json({ error: "Parent comment not found" }, { status: 400 })
      }
    }

    const id = `c-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
    const authorName = resolveName(user)

    // Ensure the commenter has a clean username for profile links
    const username = await ensureUsername(user.id, authorName, user.username)

    const inserted = await db`
      INSERT INTO comments (id, promise_id, state_id, parent_id, body, user_id, author_name)
      VALUES (${id}, ${promiseId}, ${stateId}, ${parentId || null}, ${body.trim()}, ${user.id}, ${authorName})
      RETURNING id, promise_id, state_id, parent_id, body, user_id, author_name, upvotes, downvotes, created_at
    `

    const comment = { ...inserted[0], username, score: 0, userVote: 0, image_url: user.imageUrl || null }

    // Fire a notification if this is a reply and the parent author is different
    if (parentId) {
      try {
        const [parentComment, promiseTitleRows] = await Promise.all([
          db`SELECT user_id, author_name FROM comments WHERE id = ${parentId}`,
          db`SELECT title FROM promises WHERE id = ${promiseId} LIMIT 1`,
        ])
        const parentAuthorId = parentComment[0]?.user_id
        const promiseTitle = promiseTitleRows[0]?.title ?? promiseId

        if (parentAuthorId && parentAuthorId !== user.id) {
          const notifId = `n-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
          await db`
            INSERT INTO notifications
              (id, recipient_user_id, type, comment_id, parent_comment_id, promise_id, state_id, promise_title, actor_name, actor_user_id, body_preview)
            VALUES
              (${notifId}, ${parentAuthorId}, 'reply', ${id}, ${parentId}, ${promiseId}, ${stateId}, ${promiseTitle}, ${authorName}, ${user.id}, ${body.trim().slice(0, 120)})
          `

          // Send email notification to the parent comment author
          try {
            const client = await clerkClient()
            const parentClerkUser = await client.users.getUser(parentAuthorId as string)
            const toEmail = parentClerkUser.emailAddresses?.[0]?.emailAddress
            const recipientName = parentClerkUser.fullName || parentClerkUser.firstName || parentComment[0]?.author_name || "Community Member"
            const replyEmailEnabled = await isEmailEnabled(parentAuthorId as string, "email_on_reply")
            if (toEmail && replyEmailEnabled) {
              sendReplyNotificationEmail({
                toEmail,
                recipientName,
                replierName: authorName,
                replyBody: body.trim(),
                promiseTitle,
                stateId,
                promiseId,
                commentId: id,
              })
            }
          } catch (emailErr) {
            console.error("[v0] Reply email notification failed:", emailErr)
          }
        }
      } catch (notifErr) {
        console.error("[v0] Notification/email block failed:", notifErr)
      }
    }

    return NextResponse.json({ comment })
  } catch (error) {
    console.error("[v0] Error creating comment:", error)
    return NextResponse.json({ error: "Failed to create comment" }, { status: 500 })
  }
}

// DELETE /api/promises/comments?commentId=X - Admin-only delete (cascades to replies)
export async function DELETE(request: NextRequest) {
  try {
    const user = await currentUser()
    if (!user || !isAdmin(user.id)) {
      return NextResponse.json({ error: "Only admins can delete comments" }, { status: 403 })
    }

    const commentId = request.nextUrl.searchParams.get("commentId")
    if (!commentId) {
      return NextResponse.json({ error: "Missing commentId" }, { status: 400 })
    }

    await getDb()`DELETE FROM comments WHERE id = ${commentId}`
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] Error deleting comment:", error)
    return NextResponse.json({ error: "Failed to delete comment" }, { status: 500 })
  }
}
