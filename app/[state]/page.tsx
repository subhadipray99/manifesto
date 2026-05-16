import { notFound } from "next/navigation"
import { neon } from "@neondatabase/serverless"
import PromiseTracker from "@/components/promise-tracker"
import type { Metadata } from "next"
import type { StateConfig } from "@/lib/states/types"

const sql = neon(process.env.DATABASE_URL!)

// Fetch state config from database
async function getStateConfigFromDB(stateId: string): Promise<StateConfig | null> {
  try {
    // Fetch state
    const stateResult = await sql`
      SELECT id, name, party, start_date, flag_colors
      FROM states
      WHERE id = ${stateId}
    `

    if (stateResult.length === 0) {
      return null
    }

    const state = stateResult[0]

    // Fetch categories
    const categories = await sql`
      SELECT id, name, icon, color, sort_order
      FROM categories
      WHERE state_id = ${stateId}
      ORDER BY sort_order ASC, name ASC
    `

    // Fetch promises
    const promises = await sql`
      SELECT id, category_id, title, description, source, sort_order
      FROM promises
      WHERE state_id = ${stateId}
      ORDER BY sort_order ASC, title ASC
    `

    // Build config structure
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

    return {
      id: state.id,
      name: state.name,
      party: state.party,
      startDate: new Date(state.start_date),
      flagColors: state.flag_colors || ["#FF9933", "#FFFFFF", "#138808"],
      categories: categoriesWithPromises,
    }
  } catch (error) {
    console.error("Error fetching state config:", error)
    return null
  }
}

// Fetch all state IDs for static generation
async function getAllStateIdsFromDB(): Promise<string[]> {
  try {
    const states = await sql`SELECT id FROM states`
    return states.map((s: any) => s.id)
  } catch (error) {
    console.error("Error fetching state IDs:", error)
    return ["west-bengal"] // Fallback
  }
}

// Generate static params for all states
export async function generateStaticParams() {
  const stateIds = await getAllStateIdsFromDB()
  return stateIds.map((state) => ({ state }))
}

// Generate dynamic metadata based on state
export async function generateMetadata({
  params,
}: {
  params: Promise<{ state: string }>
}): Promise<Metadata> {
  const { state } = await params
  const stateConfig = await getStateConfigFromDB(state)

  if (!stateConfig) {
    return { title: "State Not Found | The Manifesto" }
  }

  return {
    title: `${stateConfig.party} ${stateConfig.name} Promise Tracker | The Manifesto`,
    description: `Track every ${stateConfig.party} manifesto promise for ${stateConfig.name}. Citizen-powered accountability tracking fulfillment of election commitments.`,
    openGraph: {
      title: `${stateConfig.party} ${stateConfig.name} Promise Tracker | The Manifesto`,
      description: `Track every ${stateConfig.party} manifesto promise for ${stateConfig.name}. Are they keeping their word?`,
    },
  }
}

export default async function StatePage({
  params,
}: {
  params: Promise<{ state: string }>
}) {
  const { state } = await params
  const stateConfig = await getStateConfigFromDB(state)

  if (!stateConfig) {
    notFound()
  }

  // Serialize the Date object to ISO string for client component
  const serializedConfig = {
    ...stateConfig,
    startDate: stateConfig.startDate.toISOString(),
  }

  return <PromiseTracker stateConfig={serializedConfig as any} />
}
