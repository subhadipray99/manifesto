import { neon } from "@neondatabase/serverless"
import { NextResponse } from "next/server"

const getDb = () => neon(process.env.DATABASE_URL!)

// GET all states
export async function GET() {
  try {
    const states = await getDb()`
      SELECT id, name, party, start_date, flag_colors, created_at, updated_at
      FROM states
      ORDER BY name ASC
    `
    return NextResponse.json(states)
  } catch (error) {
    console.error("Error fetching states:", error)
    return NextResponse.json({ error: "Failed to fetch states" }, { status: 500 })
  }
}

// POST create new state
export async function POST(request: Request) {
  try {
    const { id, name, party, startDate, flagColors } = await request.json()

    if (!id || !name || !party || !startDate) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Validate id format (slug)
    const slugRegex = /^[a-z0-9-]+$/
    if (!slugRegex.test(id)) {
      return NextResponse.json({ error: "ID must be lowercase letters, numbers, and hyphens only" }, { status: 400 })
    }

    const result = await getDb()`
      INSERT INTO states (id, name, party, start_date, flag_colors)
      VALUES (${id}, ${name}, ${party}, ${startDate}, ${JSON.stringify(flagColors || ["#FF9933", "#FFFFFF", "#138808"])})
      RETURNING *
    `

    return NextResponse.json(result[0], { status: 201 })
  } catch (error: any) {
    console.error("Error creating state:", error)
    if (error.code === "23505") {
      return NextResponse.json({ error: "State with this ID already exists" }, { status: 409 })
    }
    return NextResponse.json({ error: "Failed to create state" }, { status: 500 })
  }
}

// PUT update state
export async function PUT(request: Request) {
  try {
    const { id, name, party, startDate, flagColors } = await request.json()

    if (!id) {
      return NextResponse.json({ error: "State ID is required" }, { status: 400 })
    }

    const result = await getDb()`
      UPDATE states
      SET 
        name = COALESCE(${name}, name),
        party = COALESCE(${party}, party),
        start_date = COALESCE(${startDate}, start_date),
        flag_colors = COALESCE(${flagColors ? JSON.stringify(flagColors) : null}, flag_colors),
        updated_at = NOW()
      WHERE id = ${id}
      RETURNING *
    `

    if (result.length === 0) {
      return NextResponse.json({ error: "State not found" }, { status: 404 })
    }

    return NextResponse.json(result[0])
  } catch (error) {
    console.error("Error updating state:", error)
    return NextResponse.json({ error: "Failed to update state" }, { status: 500 })
  }
}

// DELETE state
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")

    if (!id) {
      return NextResponse.json({ error: "State ID is required" }, { status: 400 })
    }

    const result = await getDb()`
      DELETE FROM states WHERE id = ${id}
      RETURNING id
    `

    if (result.length === 0) {
      return NextResponse.json({ error: "State not found" }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting state:", error)
    return NextResponse.json({ error: "Failed to delete state" }, { status: 500 })
  }
}
