import { notFound } from "next/navigation"
import { getStateConfig, getAllStateIds } from "@/lib/states"
import PromiseTracker from "@/components/promise-tracker"
import type { Metadata } from "next"

// Generate static params for all states
export function generateStaticParams() {
  return getAllStateIds().map((state) => ({ state }))
}

// Generate dynamic metadata based on state
export async function generateMetadata({
  params,
}: {
  params: Promise<{ state: string }>
}): Promise<Metadata> {
  const { state } = await params
  const stateConfig = getStateConfig(state)

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
  const stateConfig = getStateConfig(state)

  if (!stateConfig) {
    notFound()
  }

  return <PromiseTracker stateConfig={stateConfig} />
}
