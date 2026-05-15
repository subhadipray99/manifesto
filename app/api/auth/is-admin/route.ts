import { NextRequest, NextResponse } from "next/server"

// Helper to check if user is admin
function isAdmin(userId: string | null): boolean {
  if (!userId) return false
  const adminIds = process.env.ADMIN_USER_IDS?.split(",").map((id) => id.trim()) || []
  return adminIds.includes(userId)
}

// GET /api/auth/is-admin?userId=X - Check if user is admin
export async function GET(request: NextRequest) {
  try {
    const userId = request.nextUrl.searchParams.get("userId")
    
    if (!userId) {
      return NextResponse.json({ isAdmin: false })
    }

    return NextResponse.json({ isAdmin: isAdmin(userId) })
  } catch (error) {
    console.error("[v0] Error checking admin status:", error)
    return NextResponse.json({ isAdmin: false })
  }
}
