import { neon } from "@neondatabase/serverless"
import { NextResponse } from "next/server"

const getDb = () => neon(process.env.DATABASE_URL!)

export async function GET() {
  try {
    await getDb()`
      CREATE TABLE IF NOT EXISTS notices (
        id SERIAL PRIMARY KEY,
        type VARCHAR(50) NOT NULL,
        headline TEXT NOT NULL,
        body TEXT,
        url TEXT,
        url_text TEXT,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Migration error:", error)
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
