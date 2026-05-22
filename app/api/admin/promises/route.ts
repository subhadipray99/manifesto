import { neon } from "@neondatabase/serverless"
import { NextResponse } from "next/server"

const getDb = () => neon(process.env.DATABASE_URL!)

// GET promises (optionally filtered by state or category)
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const stateId = searchParams.get("stateId")
    const categoryId = searchParams.get("categoryId")

    let promises
    if (categoryId) {
      promises = await getDb()`
        SELECT p.id, p.category_id, p.state_id, p.title, p.description, p.source, p.sort_order, p.created_at, p.updated_at,
               c.name as category_name
        FROM promises p
        JOIN categories c ON p.category_id = c.id
        WHERE p.category_id = ${categoryId}
        ORDER BY p.sort_order ASC, p.title ASC
      `
    } else if (stateId) {
      promises = await getDb()`
        SELECT p.id, p.category_id, p.state_id, p.title, p.description, p.source, p.sort_order, p.created_at, p.updated_at,
               c.name as category_name
        FROM promises p
        JOIN categories c ON p.category_id = c.id
        WHERE p.state_id = ${stateId}
        ORDER BY c.sort_order ASC, p.sort_order ASC, p.title ASC
      `
    } else {
      promises = await getDb()`
        SELECT p.id, p.category_id, p.state_id, p.title, p.description, p.source, p.sort_order, p.created_at, p.updated_at,
               c.name as category_name, s.name as state_name
        FROM promises p
        JOIN categories c ON p.category_id = c.id
        JOIN states s ON p.state_id = s.id
        ORDER BY s.name ASC, c.sort_order ASC, p.sort_order ASC
      `
    }

    return NextResponse.json(promises)
  } catch (error) {
    console.error("Error fetching promises:", error)
    return NextResponse.json({ error: "Failed to fetch promises" }, { status: 500 })
  }
}

// POST create new promise
export async function POST(request: Request) {
  try {
    const { id, categoryId, stateId, title, description, source, sortOrder } = await request.json()

    if (!id || !categoryId || !stateId || !title) {
      return NextResponse.json({ error: "Missing required fields (id, categoryId, stateId, title)" }, { status: 400 })
    }

    const result = await getDb()`
      INSERT INTO promises (id, category_id, state_id, title, description, source, sort_order)
      VALUES (${id}, ${categoryId}, ${stateId}, ${title}, ${description || null}, ${source || null}, ${sortOrder || 0})
      RETURNING *
    `

    return NextResponse.json(result[0], { status: 201 })
  } catch (error: any) {
    console.error("Error creating promise:", error)
    if (error.code === "23505") {
      return NextResponse.json({ error: "Promise with this ID already exists" }, { status: 409 })
    }
    if (error.code === "23503") {
      return NextResponse.json({ error: "Category or State not found" }, { status: 404 })
    }
    return NextResponse.json({ error: "Failed to create promise" }, { status: 500 })
  }
}

// PUT update promise
export async function PUT(request: Request) {
  try {
    const { id, title, description, source, sortOrder, categoryId } = await request.json()

    if (!id) {
      return NextResponse.json({ error: "Promise ID is required" }, { status: 400 })
    }

    const result = await getDb()`
      UPDATE promises
      SET 
        title = COALESCE(${title}, title),
        description = COALESCE(${description}, description),
        source = COALESCE(${source}, source),
        sort_order = COALESCE(${sortOrder}, sort_order),
        category_id = COALESCE(${categoryId}, category_id),
        updated_at = NOW()
      WHERE id = ${id}
      RETURNING *
    `

    if (result.length === 0) {
      return NextResponse.json({ error: "Promise not found" }, { status: 404 })
    }

    return NextResponse.json(result[0])
  } catch (error) {
    console.error("Error updating promise:", error)
    return NextResponse.json({ error: "Failed to update promise" }, { status: 500 })
  }
}

// DELETE promise
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")

    if (!id) {
      return NextResponse.json({ error: "Promise ID is required" }, { status: 400 })
    }

    const result = await getDb()`
      DELETE FROM promises WHERE id = ${id}
      RETURNING id
    `

    if (result.length === 0) {
      return NextResponse.json({ error: "Promise not found" }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting promise:", error)
    return NextResponse.json({ error: "Failed to delete promise" }, { status: 500 })
  }
}
