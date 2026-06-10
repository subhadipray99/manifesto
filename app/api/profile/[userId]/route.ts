import { neon } from "@neondatabase/serverless"
import { NextRequest, NextResponse } from "next/server"
import { resolveUserId, ensureUsername } from "@/lib/usernames"

const getDb = () => neon(process.env.DATABASE_URL!)

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId: identifier } = await params

    if (!identifier) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 })
    }

    // The route param may be a clean username or a raw Clerk user_id
    const userId = await resolveUserId(identifier)

    if (!userId) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 })
    }

    // Get profile info + aggregated stats in one query
    const [profile] = await getDb()`
      SELECT
        user_id,
        MAX(submitted_by) as name,
        COUNT(*) FILTER (WHERE status = 'approved') as total_contributions,
        COUNT(*) FILTER (WHERE status = 'pending') as pending_contributions,
        COUNT(DISTINCT DATE(created_at)) FILTER (WHERE status = 'approved') as active_days,
        COUNT(DISTINCT state_id) FILTER (WHERE status = 'approved') as states_contributed,
        MIN(created_at) FILTER (WHERE status = 'approved') as member_since,
        MAX(created_at) FILTER (WHERE status = 'approved') as last_active
      FROM timeline_updates
      WHERE user_id = ${userId}
      GROUP BY user_id
    `

    if (!profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 })
    }

    // Get recent approved contributions
    const contributions = await getDb()`
      SELECT
        t.id,
        t.title,
        t.link,
        t.description,
        t.created_at,
        t.state_id,
        t.promise_id,
        p.title    as promise_title,
        cat.name   as category_name,
        cat.color  as category_color,
        s.name     as state_name
      FROM timeline_updates t
      LEFT JOIN promises    p   ON p.id   = t.promise_id
      LEFT JOIN categories  cat ON cat.id = p.category_id
      LEFT JOIN states      s   ON s.id   = t.state_id
      WHERE t.user_id = ${userId} AND t.status = 'approved'
      ORDER BY t.created_at DESC
      LIMIT 50
    `

    // Build activity heatmap data — contributions per day last 52 weeks
    const activityData = await getDb()`
      SELECT
        DATE(created_at) as day,
        COUNT(*) as count
      FROM timeline_updates
      WHERE user_id = ${userId}
        AND status = 'approved'
        AND created_at >= NOW() - INTERVAL '364 days'
      GROUP BY DATE(created_at)
      ORDER BY day ASC
    `

    // Ensure this user has a clean username (backfill on first view) and fetch bio/social_links
    const username = await ensureUsername(userId, profile.name as string | undefined)

    const [usernameMeta] = await getDb()`
      SELECT bio, social_links FROM usernames WHERE user_id = ${userId}
    `

    return NextResponse.json({
      profile: {
        userId: profile.user_id,
        username,
        name: profile.name,
        bio: usernameMeta?.bio ?? null,
        socialLinks: usernameMeta?.social_links ?? {},
        totalContributions: Number(profile.total_contributions),
        pendingContributions: Number(profile.pending_contributions),
        activeDays: Number(profile.active_days),
        statesContributed: Number(profile.states_contributed),
        memberSince: profile.member_since,
        lastActive: profile.last_active,
      },
      contributions,
      activityData,
    })
  } catch (error) {
    console.error("[v0] Error fetching profile:", error)
    return NextResponse.json({ error: "Failed to fetch profile" }, { status: 500 })
  }
}
