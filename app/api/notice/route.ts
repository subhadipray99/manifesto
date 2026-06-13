import { neon } from "@neondatabase/serverless"
import { NextResponse } from "next/server"

const getDb = () => neon(process.env.DATABASE_URL!)

export async function GET() {
  try {
    const result = await getDb()`
      SELECT * FROM notices
      WHERE is_active = true
      ORDER BY updated_at DESC
      LIMIT 1
    `
    
    if (result.length === 0) {
      return NextResponse.json({ notice: null })
    }

    return NextResponse.json({ notice: result[0] })
  } catch (error) {
    console.error("Error fetching notice:", error)
    return NextResponse.json({ notice: null })
  }
}
