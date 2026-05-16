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
  detail: string
}

export type Category = {
  id: string
  name: string
  localName: string // renamed from 'bengali' to be generic
  tagline: string
  promises: Promise[]
}

export type StateConfig = {
  id: string // URL slug e.g. "west-bengal"
  name: string // Full name e.g. "West Bengal"
  localName: string // Local language name e.g. "পশ্চিমবঙ্গ"
  party: string // Ruling party e.g. "BJP"
  startDate: Date // When the government took power
  accentColor: string // Tailwind color e.g. "orange"
  categories: Category[]
}
