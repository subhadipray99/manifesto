import type { Metadata } from "next"
import { getStateConfig } from "@/lib/states"
import PromiseTracker from "@/components/promise-tracker"

export const metadata: Metadata = {
  title: "BJP West Bengal Promise Tracker | West Bengal BJP Manifesto Accountability",
  description: "Track BJP West Bengal promises with real-time updates. Monitor promise fulfillment across categories like governance, employment, and infrastructure. Citizen-powered accountability for West Bengal elections.",
  openGraph: {
    title: "BJP West Bengal Promise Tracker - Monitor Manifesto Promises",
    description: "Track West Bengal BJP manifesto promises in real-time. Monitor fulfillment across governance, employment, infrastructure, and more.",
    url: "https://manifesto.page",
    type: "website",
  },
}

export default function Page() {
  // Default to West Bengal for the main page
  const stateConfig = getStateConfig("west-bengal")!
  
  return <PromiseTracker stateConfig={stateConfig} />
}
