import type { MetadataRoute } from "next"

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin", "/api/"],
    },
    sitemap: "https://themanifesto.vercel.app/sitemap.xml",
    host: "https://themanifesto.vercel.app",
  }
}
