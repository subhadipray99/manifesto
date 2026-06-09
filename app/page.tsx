import type { Metadata } from "next"
import { getStateConfig } from "@/lib/states"
import PromiseTracker from "@/components/promise-tracker"

export const metadata: Metadata = {
  title: "BJP Promise Tracker | Track BJP Manifesto Promises & Fulfillment",
  description: "BJP Promise Tracker — monitor every BJP manifesto promise and its fulfillment in real time. Track election commitments across governance, employment, and infrastructure with citizen-powered accountability.",
  alternates: {
    canonical: "https://manifesto.page",
  },
  openGraph: {
    title: "BJP Promise Tracker — Track Every BJP Manifesto Promise",
    description: "Monitor BJP manifesto promises and fulfillment in real time across governance, employment, infrastructure, and more.",
    url: "https://manifesto.page",
    type: "website",
  },
}

export default function Page() {
  // Default to West Bengal for the main page
  const stateConfig = getStateConfig("west-bengal")!
  
  return <PromiseTracker stateConfig={stateConfig} />
}
