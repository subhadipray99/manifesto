import { neon } from "@neondatabase/serverless"
import { NextRequest, NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"

const getDb = () => neon(process.env.DATABASE_URL!)

const SUPPORTED_PLATFORMS = ["twitter", "github", "linkedin", "instagram", "website", "youtube"] as const
type Platform = (typeof SUPPORTED_PLATFORMS)[number]

export async function PATCH(request: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const body = await request.json()
    const { bio, socialLinks } = body as { bio?: string; socialLinks?: Record<Platform, string> }

    // Sanitise bio
    const cleanBio = typeof bio === "string" ? bio.trim().slice(0, 300) : undefined

    // Sanitise social links — only allow known platforms and valid URLs
    const cleanLinks: Record<string, string> = {}
    if (socialLinks && typeof socialLinks === "object") {
      for (const platform of SUPPORTED_PLATFORMS) {
        const val = socialLinks[platform]
        if (typeof val === "string" && val.trim()) {
          cleanLinks[platform] = val.trim().slice(0, 255)
        }
      }
    }

    await getDb()`
      UPDATE usernames
      SET
        bio = COALESCE(${cleanBio ?? null}, bio),
        social_links = ${JSON.stringify(cleanLinks)}::jsonb,
        updated_at = NOW()
      WHERE user_id = ${userId}
    `

    return NextResponse.json({ bio: cleanBio, socialLinks: cleanLinks })
  } catch (error) {
    console.error("[v0] Error saving profile social:", error)
    return NextResponse.json({ error: "Failed to save" }, { status: 500 })
  }
}
