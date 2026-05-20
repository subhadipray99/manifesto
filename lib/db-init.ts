import { neon } from "@neondatabase/serverless"
import { CATEGORIES } from "@/lib/promises-data"

const getDb = () => neon(process.env.DATABASE_URL!)

async function initializePromises() {
  try {
    // Insert all promises from CATEGORIES into promise_statuses table
    const allPromises = CATEGORIES.flatMap((cat) =>
      cat.promises.map((p) => ({
        id: p.id,
        status: "pending",
      }))
    )

    for (const promise of allPromises) {
      await getDb()`
        INSERT INTO promise_statuses (id, status)
        VALUES (${promise.id}, ${promise.status})
        ON CONFLICT (id) DO NOTHING
      `
    }

    console.log(`[v0] Initialized ${allPromises.length} promises in database`)
    return { success: true, count: allPromises.length }
  } catch (error) {
    console.error("[v0] Error initializing promises:", error)
    throw error
  }
}

export { initializePromises }
