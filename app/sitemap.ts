import type { MetadataRoute } from "next"
import { neon } from "@neondatabase/serverless"

const getDb = () => neon(process.env.DATABASE_URL!)

async function getAllStates(): Promise<string[]> {
  try {
    const states = await getDb()`SELECT id FROM states`
    return states.map((s: any) => s.id)
  } catch (error) {
    console.error("Error fetching states for sitemap:", error)
    return ["west-bengal"]
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const stateIds = await getAllStates()
  const baseUrl = "https://themanifesto.vercel.app"

  const stateUrls: MetadataRoute.Sitemap = stateIds.map((stateId) => ({
    url: `${baseUrl}/${stateId}`,
    lastModified: new Date(),
    changeFrequency: "daily",
    priority: 0.8,
  }))

  return [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: `${baseUrl}/states`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.7,
    },
    ...stateUrls,
  ]
}
