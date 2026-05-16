import { neon } from "@neondatabase/serverless"
import { NextResponse } from "next/server"

const sql = neon(process.env.DATABASE_URL!)

// GET all states (public endpoint for listing available states)
export async function GET() {
  try {
    const states = await sql`
      SELECT id, name, party, start_date
      FROM states
      ORDER BY name ASC
    `
    return NextResponse.json(states)
  } catch (error) {
    console.error("Error fetching states:", error)
    return NextResponse.json({ error: "Failed to fetch states" }, { status: 500 })
  }
}
