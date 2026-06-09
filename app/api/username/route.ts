import { NextRequest, NextResponse } from "next/server"
import { currentUser } from "@clerk/nextjs/server"
import { setUsername, getUsername, ensureUsername, isValidUsername } from "@/lib/usernames"

// GET /api/username - returns the signed-in user's current username
export async function GET() {
  try {
    const user = await currentUser()
    if (!user) {
      return NextResponse.json({ error: "Not signed in" }, { status: 401 })
    }
    const displayName =
      user.fullName || user.firstName || user.username || (user.emailAddresses?.[0]?.emailAddress ?? undefined)
    const username = await ensureUsername(user.id, displayName)
    return NextResponse.json({ username })
  } catch (error) {
    console.error("[v0] Error getting username:", error)
    return NextResponse.json({ error: "Failed to get username" }, { status: 500 })
  }
}

// PATCH /api/username - update the signed-in user's username
// body: { username }
export async function PATCH(request: NextRequest) {
  try {
    const user = await currentUser()
    if (!user) {
      return NextResponse.json({ error: "You must be signed in" }, { status: 401 })
    }

    const { username } = await request.json()
    if (typeof username !== "string") {
      return NextResponse.json({ error: "Username is required" }, { status: 400 })
    }

    const normalized = username.toLowerCase().trim()
    if (!isValidUsername(normalized)) {
      return NextResponse.json(
        { error: "Use 3-40 letters, numbers, or hyphens. Cannot start or end with a hyphen." },
        { status: 400 },
      )
    }

    const current = await getUsername(user.id)
    if (current === normalized) {
      return NextResponse.json({ username: normalized })
    }

    try {
      await setUsername(user.id, normalized)
    } catch (e: any) {
      if (e.message === "TAKEN") {
        return NextResponse.json({ error: "That username is already taken" }, { status: 409 })
      }
      if (e.message === "INVALID") {
        return NextResponse.json({ error: "That username is not valid" }, { status: 400 })
      }
      throw e
    }

    return NextResponse.json({ username: normalized })
  } catch (error) {
    console.error("[v0] Error setting username:", error)
    return NextResponse.json({ error: "Failed to update username" }, { status: 500 })
  }
}
