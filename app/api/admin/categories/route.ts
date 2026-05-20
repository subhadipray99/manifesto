import { neon } from "@neondatabase/serverless"
import { NextResponse } from "next/server"

const getDb = () => neon(process.env.DATABASE_URL!)

// GET categories (optionally filtered by state)
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const stateId = searchParams.get("stateId")

    const categories = stateId
      ? await getDb()`
          SELECT id, state_id, name, icon, color, sort_order, created_at, updated_at
          FROM categories
          WHERE state_id = ${stateId}
          ORDER BY sort_order ASC, name ASC
        `
      : await getDb()`
          SELECT c.id, c.state_id, c.name, c.icon, c.color, c.sort_order, c.created_at, c.updated_at, s.name as state_name
          FROM categories c
          JOIN states s ON c.state_id = s.id
          ORDER BY s.name ASC, c.sort_order ASC, c.name ASC
        `

    return NextResponse.json(categories)
  } catch (error) {
    console.error("Error fetching categories:", error)
    return NextResponse.json({ error: "Failed to fetch categories" }, { status: 500 })
  }
}

// POST create new category
export async function POST(request: Request) {
  try {
    const { id, stateId, name, icon, color, sortOrder } = await request.json()

    if (!id || !stateId || !name) {
      return NextResponse.json({ error: "Missing required fields (id, stateId, name)" }, { status: 400 })
    }

    const result = await getDb()`
      INSERT INTO categories (id, state_id, name, icon, color, sort_order)
      VALUES (${id}, ${stateId}, ${name}, ${icon || 'FileText'}, ${color || '#FF9933'}, ${sortOrder || 0})
      RETURNING *
    `

    return NextResponse.json(result[0], { status: 201 })
  } catch (error: any) {
    console.error("Error creating category:", error)
    if (error.code === "23505") {
      return NextResponse.json({ error: "Category with this ID already exists" }, { status: 409 })
    }
    if (error.code === "23503") {
      return NextResponse.json({ error: "State not found" }, { status: 404 })
    }
    return NextResponse.json({ error: "Failed to create category" }, { status: 500 })
  }
}

// PUT update category
export async function PUT(request: Request) {
  try {
    const { id, name, icon, color, sortOrder } = await request.json()

    if (!id) {
      return NextResponse.json({ error: "Category ID is required" }, { status: 400 })
    }

    const result = await getDb()`
      UPDATE categories
      SET 
        name = COALESCE(${name}, name),
        icon = COALESCE(${icon}, icon),
        color = COALESCE(${color}, color),
        sort_order = COALESCE(${sortOrder}, sort_order),
        updated_at = NOW()
      WHERE id = ${id}
      RETURNING *
    `

    if (result.length === 0) {
      return NextResponse.json({ error: "Category not found" }, { status: 404 })
    }

    return NextResponse.json(result[0])
  } catch (error) {
    console.error("Error updating category:", error)
    return NextResponse.json({ error: "Failed to update category" }, { status: 500 })
  }
}

// DELETE category
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")

    if (!id) {
      return NextResponse.json({ error: "Category ID is required" }, { status: 400 })
    }

    const result = await getDb()`
      DELETE FROM categories WHERE id = ${id}
      RETURNING id
    `

    if (result.length === 0) {
      return NextResponse.json({ error: "Category not found" }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting category:", error)
    return NextResponse.json({ error: "Failed to delete category" }, { status: 500 })
  }
}
