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
          "User-Agent": "TheManifestoApp/1.0",
          Accept: "application/json",
        },
      }
    )

    if (!res.ok) {
      return NextResponse.json({ posts: [], error: "WordPress API unavailable" }, { status: 200 })
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
