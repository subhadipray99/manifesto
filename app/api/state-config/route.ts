import { neon } from "@neondatabase/serverless"
import { NextResponse } from "next/server"

const sql = neon(process.env.DATABASE_URL!)

// GET full state config (state + categories + promises)
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const stateId = searchParams.get("stateId")

    if (!stateId) {
      return NextResponse.json({ error: "stateId is required" }, { status: 400 })
    }

    // Fetch state
    const stateResult = await sql`
      SELECT id, name, party, start_date, flag_colors
      FROM states
      WHERE id = ${stateId}
    `

    if (stateResult.length === 0) {
      return NextResponse.json({ error: "State not found" }, { status: 404 })
    }

    const state = stateResult[0]

    // Fetch categories with their promises
    const categories = await sql`
      SELECT id, name, icon, color, sort_order
      FROM categories
      WHERE state_id = ${stateId}
      ORDER BY sort_order ASC, name ASC
    `

    const promises = await sql`
      SELECT id, category_id, title, description, source, sort_order
      FROM promises
      WHERE state_id = ${stateId}
      ORDER BY sort_order ASC, title ASC
    `

    // Build the config structure
    const categoriesWithPromises = categories.map((cat: any) => ({
      id: cat.id,
      name: cat.name,
      icon: cat.icon,
      color: cat.color,
      promises: promises
        .filter((p: any) => p.category_id === cat.id)
        .map((p: any) => ({
          id: p.id,
          title: p.title,
          description: p.description || undefined,
          source: p.source || undefined,
        })),
    }))

    const config = {
      id: state.id,
      name: state.name,
      party: state.party,
      startDate: state.start_date,
      flagColors: state.flag_colors || ["#FF9933", "#FFFFFF", "#138808"],
      categories: categoriesWithPromises,
    }

    return NextResponse.json(config)
  } catch (error) {
    console.error("Error fetching state config:", error)
    return NextResponse.json({ error: "Failed to fetch state config" }, { status: 500 })
  }
}
