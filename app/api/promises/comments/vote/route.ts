import { neon } from "@neondatabase/serverless"
import { NextRequest, NextResponse } from "next/server"
import { currentUser } from "@clerk/nextjs/server"

const getDb = () => neon(process.env.DATABASE_URL!)

// POST /api/promises/comments/vote - Upvote or downvote a comment
// body: { commentId, vote }  where vote is 1 (up), -1 (down), or 0 (clear)
export async function POST(request: NextRequest) {
  try {
    const user = await currentUser()
    if (!user) {
      return NextResponse.json({ error: "You must be signed in to vote" }, { status: 401 })
    }

    const { commentId, vote } = await request.json()
    if (!commentId || ![1, -1, 0].includes(vote)) {
      return NextResponse.json({ error: "Invalid vote payload" }, { status: 400 })
    }

    const db = getDb()

    // Find the user's existing vote on this comment
    const existing = await db`
      SELECT vote FROM comment_votes WHERE comment_id = ${commentId} AND user_id = ${user.id}
    `
    const prevVote: number = existing.length > 0 ? existing[0].vote : 0

    // If clicking the same vote again, treat as clearing it (toggle off)
    const nextVote = prevVote === vote ? 0 : vote

    if (nextVote === 0) {
      await db`DELETE FROM comment_votes WHERE comment_id = ${commentId} AND user_id = ${user.id}`
    } else {
      await db`
        INSERT INTO comment_votes (comment_id, user_id, vote)
        VALUES (${commentId}, ${user.id}, ${nextVote})
        ON CONFLICT (comment_id, user_id) DO UPDATE SET vote = ${nextVote}, created_at = NOW()
      `
    }

    // Recalculate counts from the source of truth
    const counts = await db`
      SELECT
        COALESCE(SUM(CASE WHEN vote = 1 THEN 1 ELSE 0 END), 0)::int AS upvotes,
        COALESCE(SUM(CASE WHEN vote = -1 THEN 1 ELSE 0 END), 0)::int AS downvotes
      FROM comment_votes WHERE comment_id = ${commentId}
    `
    const upvotes = counts[0].upvotes
    const downvotes = counts[0].downvotes

    await db`
      UPDATE comments SET upvotes = ${upvotes}, downvotes = ${downvotes} WHERE id = ${commentId}
    `

    return NextResponse.json({
      commentId,
      upvotes,
      downvotes,
      score: upvotes - downvotes,
      userVote: nextVote,
    })
  } catch (error) {
    console.error("[v0] Error voting on comment:", error)
    return NextResponse.json({ error: "Failed to register vote" }, { status: 500 })
  }
}
