import { NextRequest, NextResponse } from "next/server"
import { getAuth } from "@clerk/nextjs/server"
import { isValidUsername, isUsernameAvailable } from "@/lib/usernames"

// GET /api/username/check?username=foo
// Returns { available, valid, message }
export async function GET(request: NextRequest) {
  const { userId } = getAuth(request)
  const username = request.nextUrl.searchParams.get("username") ?? ""
  const normalized = username.toLowerCase().trim()

  if (!normalized || normalized.length < 3) {
    return NextResponse.json({ available: false, valid: false, message: "At least 3 characters" })
  }

  if (!isValidUsername(normalized)) {
    if (/^[a-z0-9-]+$/.test(normalized) && normalized.length > 0) {
      return NextResponse.json({ available: false, valid: false, message: "Cannot start or end with a hyphen, or use reserved words" })
    }
    return NextResponse.json({ available: false, valid: false, message: "Only letters, numbers, and hyphens allowed" })
  }

  if (!userId) {
    // Can still check availability without auth
    const available = await isUsernameAvailable(normalized, "")
    return NextResponse.json({ available, valid: true, message: available ? "Available" : "Already taken" })
  }

  const available = await isUsernameAvailable(normalized, userId)
  return NextResponse.json({
    available,
    valid: true,
    message: available ? "Available" : "Already taken",
  })
}
