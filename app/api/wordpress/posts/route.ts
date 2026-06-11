import { NextResponse } from "next/server"

const WP_BASE = "https://observerfiles.com/wp-json/wp/v2"

// Fields we need — keep payload small
const FIELDS = "id,title,excerpt,link,date,categories,_links"

export const revalidate = 3600 // revalidate every hour

export async function GET() {
  try {
    // Fetch latest 7 posts with embedded featured media + category names
    const res = await fetch(
      `${WP_BASE}/posts?per_page=7&_embed=wp:featuredmedia,wp:term&_fields=${FIELDS},_embedded`,
      {
        next: { revalidate: 3600 },
        headers: {
          "User-Agent": "Mozilla/5.0 (compatible; TheManifesto/1.0; +https://themanifesto.in)",
          "Accept": "application/json",
          "Accept-Language": "en-US,en;q=0.9",
          "Referer": "https://themanifesto.in/",
          "Origin": "https://themanifesto.in",
        },
      }
    )

    console.log("[v0] WordPress API status:", res.status)

    if (!res.ok) {
      const text = await res.text().catch(() => "")
      console.error("[v0] WordPress API error body:", text.slice(0, 300))
      return NextResponse.json({ posts: [], error: `WordPress API returned ${res.status}` }, { status: 200 })
    }

    const raw: any[] = await res.json()

    const posts = raw.map((post) => {
      // Featured image
      const media = post._embedded?.["wp:featuredmedia"]?.[0]
      const featuredImage =
        media?.media_details?.sizes?.medium?.source_url ||
        media?.media_details?.sizes?.thumbnail?.source_url ||
        media?.source_url ||
        null

      // Category names
      const categories: string[] =
        post._embedded?.["wp:term"]?.[0]?.map((t: any) => t.name) ?? []

      // Strip HTML tags from excerpt
      const rawExcerpt: string = post.excerpt?.rendered ?? ""
      const cleanExcerpt = rawExcerpt.replace(/<[^>]*>/g, "").replace(/\[&hellip;\]/g, "…").trim()

      // Decode HTML entities in title
      const rawTitle: string = post.title?.rendered ?? ""
      const cleanTitle = rawTitle
        .replace(/&#8216;|&#8217;/g, "'")
        .replace(/&#8220;|&#8221;/g, '"')
        .replace(/&#8211;/g, "–")
        .replace(/&#8212;/g, "—")
        .replace(/&amp;/g, "&")
        .replace(/<[^>]*>/g, "")

      return {
        id: post.id as number,
        title: cleanTitle,
        excerpt: cleanExcerpt,
        link: post.link as string,
        date: post.date as string,
        categories,
        featuredImage,
      }
    })

    return NextResponse.json({ posts }, { headers: { "Cache-Control": "s-maxage=3600, stale-while-revalidate=7200" } })
  } catch (err) {
    console.error("[v0] WordPress proxy error:", err)
    return NextResponse.json({ posts: [], error: "Failed to fetch articles" }, { status: 200 })
  }
}
