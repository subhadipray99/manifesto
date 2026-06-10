import { neon } from "@neondatabase/serverless"
import { NextRequest, NextResponse } from "next/server"

const getDb = () => neon(process.env.DATABASE_URL!)

export const dynamic = "force-dynamic"
export const maxDuration = 60

export async function GET(req: NextRequest) {
  // Verify the request is from Vercel Cron or an authorized caller
  const authHeader = req.headers.get("authorization")
  const cronSecret = process.env.CRON_SECRET
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const db = getDb()
  const results: Record<string, number> = {}

  try {
    // 1. Read notifications older than 30 days
    const [deletedReadNotifs] = await db`
      WITH deleted AS (
        DELETE FROM notifications
        WHERE is_read = TRUE AND created_at < NOW() - INTERVAL '30 days'
        RETURNING id
      ) SELECT COUNT(*) AS count FROM deleted
    `
    results.read_notifications_30d = Number(deletedReadNotifs.count)

    // 2. Unread notifications older than 90 days (user clearly never checks)
    const [deletedOldNotifs] = await db`
      WITH deleted AS (
        DELETE FROM notifications
        WHERE created_at < NOW() - INTERVAL '90 days'
        RETURNING id
      ) SELECT COUNT(*) AS count FROM deleted
    `
    results.old_notifications_90d = Number(deletedOldNotifs.count)

    // 3. Rejected timeline updates older than 60 days
    const [deletedRejected] = await db`
      WITH deleted AS (
        DELETE FROM timeline_updates
        WHERE status = 'rejected' AND created_at < NOW() - INTERVAL '60 days'
        RETURNING id
      ) SELECT COUNT(*) AS count FROM deleted
    `
    results.rejected_updates_60d = Number(deletedRejected.count)

    // 4. Pending timeline updates older than 30 days (stale, never reviewed)
    const [deletedStalePending] = await db`
      WITH deleted AS (
        DELETE FROM timeline_updates
        WHERE status = 'pending' AND created_at < NOW() - INTERVAL '30 days'
        RETURNING id
      ) SELECT COUNT(*) AS count FROM deleted
    `
    results.stale_pending_updates_30d = Number(deletedStalePending.count)

    // 5. Orphaned comment votes (comment was deleted)
    const [deletedOrphanVotes] = await db`
      WITH deleted AS (
        DELETE FROM comment_votes cv
        WHERE NOT EXISTS (
          SELECT 1 FROM comments c WHERE c.id = cv.comment_id
        )
        RETURNING comment_id
      ) SELECT COUNT(*) AS count FROM deleted
    `
    results.orphan_comment_votes = Number(deletedOrphanVotes.count)

    // 6. Expired Neon auth sessions
    const [deletedSessions] = await db`
      WITH deleted AS (
        DELETE FROM neon_auth.session
        WHERE "expiresAt" < NOW()
        RETURNING id
      ) SELECT COUNT(*) AS count FROM deleted
    `
    results.expired_sessions = Number(deletedSessions.count)

    // 7. Expired verification tokens
    const [deletedVerifications] = await db`
      WITH deleted AS (
        DELETE FROM neon_auth.verification
        WHERE "expiresAt" < NOW()
        RETURNING id
      ) SELECT COUNT(*) AS count FROM deleted
    `
    results.expired_verifications = Number(deletedVerifications.count)

    // 8. Expired JWKS signing keys
    const [deletedJwks] = await db`
      WITH deleted AS (
        DELETE FROM neon_auth.jwks
        WHERE "expiresAt" IS NOT NULL AND "expiresAt" < NOW()
        RETURNING id
      ) SELECT COUNT(*) AS count FROM deleted
    `
    results.expired_jwks = Number(deletedJwks.count)

    const totalDeleted = Object.values(results).reduce((a, b) => a + b, 0)

    return NextResponse.json({
      ok: true,
      ran_at: new Date().toISOString(),
      total_deleted: totalDeleted,
      breakdown: results,
    })
  } catch (err: any) {
    console.error("[cron/cleanup] error:", err)
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 })
  }
}
