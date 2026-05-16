import type { StateConfig } from "./types"
import { WEST_BENGAL } from "./west-bengal"

// Registry of all available states
export const STATES: Record<string, StateConfig> = {
  "west-bengal": WEST_BENGAL,
  // Add more states here:
  // "maharashtra": MAHARASHTRA,
  // "karnataka": KARNATAKA,
}

// Get all state IDs for static generation
export function getAllStateIds(): string[] {
  return Object.keys(STATES)
}

// Get state config by ID
export function getStateConfig(stateId: string): StateConfig | undefined {
  return STATES[stateId]
}

// Re-export types
export type { StateConfig, Category, Promise, PromiseStatus, TimelineUpdate } from "./types"
