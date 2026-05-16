import { getStateConfig } from "@/lib/states"
import PromiseTracker from "@/components/promise-tracker"

export default function Page() {
  // Default to West Bengal for the main page
  const stateConfig = getStateConfig("west-bengal")!
  
  return <PromiseTracker stateConfig={stateConfig} />
}
