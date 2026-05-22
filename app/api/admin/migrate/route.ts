import { neon } from "@neondatabase/serverless"
import { NextResponse } from "next/server"
import { WEST_BENGAL } from "@/lib/states/west-bengal"

const getDb = () => neon(process.env.DATABASE_URL!)

export async function POST(request: Request) {
  return runMigration(request)
}

export async function GET(request: Request) {
  return runMigration(request)
}

async function runMigration(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const adminKey = searchParams.get("key")
    
    // Simple protection - in production, use proper auth
    if (adminKey !== "migrate-data-2026") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const stateId = WEST_BENGAL.id
    let categoryCount = 0
    let promiseCount = 0

    // First ensure the state exists
    await getDb()`
      INSERT INTO states (id, name, party, start_date)
      VALUES (${stateId}, ${WEST_BENGAL.name}, ${WEST_BENGAL.party}, ${WEST_BENGAL.startDate instanceof Date ? WEST_BENGAL.startDate.toISOString() : WEST_BENGAL.startDate})
      ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, party = EXCLUDED.party, start_date = EXCLUDED.start_date
    `

    // Insert categories and promises from the actual config file
    for (let catIndex = 0; catIndex < WEST_BENGAL.categories.length; catIndex++) {
      const cat = WEST_BENGAL.categories[catIndex]
      
      await getDb()`
        INSERT INTO categories (id, state_id, name, icon, color, sort_order)
        VALUES (${cat.id}, ${stateId}, ${cat.name}, 'FileText', ${cat.color || '#FF9933'}, ${catIndex})
        ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, color = EXCLUDED.color, sort_order = EXCLUDED.sort_order
      `
      categoryCount++

      // Insert all promises for this category
      for (let promIndex = 0; promIndex < cat.promises.length; promIndex++) {
        const p = cat.promises[promIndex]
        await getDb()`
          INSERT INTO promises (id, category_id, state_id, title, description, sort_order)
          VALUES (${p.id}, ${cat.id}, ${stateId}, ${p.title}, ${p.detail || p.description || ''}, ${promIndex})
          ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title, description = EXCLUDED.description, sort_order = EXCLUDED.sort_order
        `
        promiseCount++
      }
    }

    return NextResponse.json({ 
      success: true, 
      categories: categoryCount,
      promises: promiseCount,
      message: `Migrated ${categoryCount} categories and ${promiseCount} promises from West Bengal config` 
    })
  } catch (error) {
    console.error("Migration error:", error)
    return NextResponse.json({ error: "Migration failed", details: String(error) }, { status: 500 })
  }
}
