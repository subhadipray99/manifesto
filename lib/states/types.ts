export type PromiseStatus = "pending" | "in-progress" | "fulfilled" | "broken"

export type TimelineUpdate = {
  id: string
  title: string
  link: string
  description?: string
  timestamp: string
}

export type Promise = {
  id: string
  title: string
  detail?: string
  description?: string
  source?: string
}

export type Category = {
  id: string
  name: string
  localName?: string // renamed from 'bengali' to be generic
  tagline?: string
  color?: string
  icon?: string
  promises: Promise[]
}

export type StateConfig = {
  id: string // URL slug e.g. "west-bengal"
  name: string // Full name e.g. "West Bengal"
  localName?: string // Local language name e.g. "পশ্চিমবঙ্গ"
  party: string // Ruling party e.g. "BJP"
  startDate: Date | string // When the government took power (Date or ISO string)
  accentColor?: string // Tailwind color e.g. "orange"
  flagColors?: string[] // Colors for visual elements
  categories: Category[]
}
