"use client"

import { useState, useEffect } from "react"
import { ExternalLink, X, Calendar, Tag, BookOpen, Loader2, RefreshCw, ChevronRight } from "lucide-react"

type WPPost = {
  id: number
  title: string
  excerpt: string
  link: string
  date: string
  category: string | null
  featuredImage: string | null
}

function stripHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, "")
    .replace(/&[^;]+;/g, (e) => {
      const map: Record<string, string> = {
        "&amp;": "&", "&lt;": "<", "&gt;": ">", "&quot;": '"',
        "&#039;": "'", "&nbsp;": " ", "&#8211;": "–", "&#8212;": "—",
        "&#8216;": "'", "&#8217;": "'", "&#8220;": "\u201c", "&#8221;": "\u201d",
      }
      return map[e] ?? e
    })
    .trim()
}

// ── Article Modal ─────────────────────────────────────────────────────────────

function ArticleModal({ post, onClose }: { post: WPPost; onClose: () => void }) {
  const formatted = new Date(post.date).toLocaleDateString("en-IN", {
    day: "numeric", month: "long", year: "numeric",
  })

  useEffect(() => {
    document.body.style.overflow = "hidden"
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose()
    window.addEventListener("keydown", onKey)
    return () => {
      document.body.style.overflow = ""
      window.removeEventListener("keydown", onKey)
    }
  }, [onClose])

  return (
    <div className="fixed inset-0 z-[999] flex items-end sm:items-center justify-center p-0 sm:p-4" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full sm:max-w-xl max-h-[90dvh] flex flex-col rounded-t-2xl sm:rounded-2xl bg-card border border-border overflow-hidden shadow-2xl">

        {post.featuredImage ? (
          <div className="relative h-44 flex-shrink-0 overflow-hidden bg-muted">
            <img src={post.featuredImage} alt={post.title} className="h-full w-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
            <button onClick={onClose} className="absolute top-3 right-3 flex h-8 w-8 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-sm hover:bg-black/60 transition-colors" aria-label="Close">
              <X className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-between px-5 pt-5 pb-2 flex-shrink-0">
            <BookOpen className="h-5 w-5 text-orange-500" />
            <button onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-foreground hover:bg-muted/70 transition-colors" aria-label="Close">
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
          {post.category && (
            <span className="inline-flex items-center gap-1 rounded-full bg-orange-100 dark:bg-orange-950/40 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-orange-700 dark:text-orange-400">
              <Tag className="h-2.5 w-2.5" />{post.category}
            </span>
          )}
          <h2 className="text-lg font-black leading-snug text-foreground text-balance">{post.title}</h2>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Calendar className="h-3.5 w-3.5" /><span>{formatted}</span>
          </div>
          <p className="text-sm leading-relaxed text-muted-foreground">{post.excerpt}</p>
        </div>

        <div className="flex-shrink-0 border-t border-border px-5 py-4 flex gap-3">
          <a href={post.link} target="_blank" rel="noopener noreferrer" className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-foreground px-4 py-2.5 text-sm font-bold text-background hover:opacity-90 transition-opacity">
            Read full article <ExternalLink className="h-3.5 w-3.5" />
          </a>
          <button onClick={onClose} className="flex items-center justify-center rounded-xl border-2 border-border bg-muted px-4 py-2.5 text-sm font-bold text-foreground hover:bg-muted/70 transition-colors">
            Close
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Shared fetch hook ─────────────────────────────────────────────────────────

function useArticles(refreshKey: number) {
  const [posts, setPosts] = useState<WPPost[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const controller = new AbortController()
    setLoading(true)
    setError(null)
    fetch(
      "https://observerfile.com/wp-json/wp/v2/posts?per_page=7&_embed=wp:featuredmedia,wp:term",
      { headers: { Accept: "application/json" }, signal: controller.signal }
    )
      .then((r) => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json() })
      .then((data: any[]) => {
        setPosts(data.map((p) => {
          const media = p._embedded?.["wp:featuredmedia"]?.[0]
          const terms: any[] = (p._embedded?.["wp:term"] ?? []).flat()
          const cat = terms.find((t: any) => t.taxonomy === "category")
          return {
            id: p.id,
            title: stripHtml(p.title?.rendered ?? ""),
            excerpt: stripHtml(p.excerpt?.rendered ?? ""),
            link: p.link,
            date: p.date,
            category: cat?.name ?? null,
            featuredImage: media?.source_url ?? null,
          }
        }))
      })
      .catch((err) => { if (err.name !== "AbortError") setError("Could not load articles") })
      .finally(() => setLoading(false))
    return () => controller.abort()
  }, [refreshKey])

  return { posts, loading, error }
}

// ── Articles Section ──────────────────────────────────────────────────────────

export function ArticlesSection({ mobile = false }: { mobile?: boolean }) {
  const [refreshKey, setRefreshKey] = useState(0)
  const [selected, setSelected] = useState<WPPost | null>(null)
  const { posts, loading, error } = useArticles(refreshKey)

  // ── Mobile: horizontal slider ──────────────────────────────────────────────
  if (mobile) {
    return (
      <>
        {loading && (
          <div className="flex items-center justify-center py-4">
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          </div>
        )}
        {!loading && error && (
          <p className="text-xs text-muted-foreground text-center py-2">{error}</p>
        )}
        {!loading && !error && posts.length > 0 && (
          <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1 snap-x snap-mandatory scrollbar-none" style={{ scrollbarWidth: "none" }}>
            {posts.map((post) => (
              <button
                key={post.id}
                onClick={() => setSelected(post)}
                className="snap-start flex-shrink-0 w-44 rounded-xl border border-border bg-card overflow-hidden text-left hover:border-orange-400 transition-colors"
              >
                {post.featuredImage ? (
                  <img src={post.featuredImage} alt="" className="h-24 w-full object-cover" />
                ) : (
                  <div className="flex h-24 w-full items-center justify-center bg-muted">
                    <BookOpen className="h-6 w-6 text-muted-foreground" />
                  </div>
                )}
                <div className="p-2.5">
                  {post.category && (
                    <p className="text-[9px] font-bold uppercase tracking-widest text-orange-500 mb-1">{post.category}</p>
                  )}
                  <p className="text-xs font-semibold text-foreground leading-snug line-clamp-2">{post.title}</p>
                  <p className="mt-1 text-[10px] text-muted-foreground">
                    {new Date(post.date).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                  </p>
                </div>
              </button>
            ))}
            {/* See all */}
            <a
              href="https://observerfile.com"
              target="_blank"
              rel="noopener noreferrer"
              className="snap-start flex-shrink-0 w-28 rounded-xl border-2 border-dashed border-border flex flex-col items-center justify-center gap-2 text-muted-foreground hover:border-orange-400 hover:text-orange-500 transition-colors"
            >
              <ExternalLink className="h-5 w-5" />
              <span className="text-[10px] font-semibold text-center leading-tight">More articles</span>
            </a>
          </div>
        )}
        {selected && <ArticleModal post={selected} onClose={() => setSelected(null)} />}
      </>
    )
  }

  // ── Desktop: vertical sidebar list ────────────────────────────────────────
  return (
    <>
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <div className="flex items-center gap-2">
            <BookOpen className="h-3.5 w-3.5 text-orange-500" />
            <h3 className="text-xs font-bold uppercase tracking-wide text-foreground">From ObserverFile</h3>
          </div>
          <button onClick={() => setRefreshKey((k) => k + 1)} className="text-muted-foreground hover:text-foreground transition-colors" aria-label="Refresh" title="Refresh">
            <RefreshCw className="h-3 w-3" />
          </button>
        </div>

        {loading && (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        )}

        {!loading && error && (
          <div className="px-4 py-5 text-center">
            <p className="text-xs text-muted-foreground">{error}</p>
            <button onClick={() => setRefreshKey((k) => k + 1)} className="mt-2 text-xs font-semibold text-orange-600 hover:underline">Try again</button>
          </div>
        )}

        {!loading && !error && posts.length === 0 && (
          <div className="px-4 py-5 text-center">
            <p className="text-xs text-muted-foreground">No articles found.</p>
          </div>
        )}

        {!loading && !error && posts.length > 0 && (
          <ul className="divide-y divide-border">
            {posts.map((post) => (
              <li key={post.id}>
                <button
                  onClick={() => setSelected(post)}
                  className="w-full flex items-start gap-3 px-4 py-3 text-left hover:bg-muted/40 transition-colors group"
                >
                  {post.featuredImage ? (
                    <img src={post.featuredImage} alt="" className="flex-shrink-0 mt-0.5 h-12 w-12 rounded-lg object-cover border border-border" />
                  ) : (
                    <div className="flex-shrink-0 mt-0.5 flex h-12 w-12 items-center justify-center rounded-lg bg-muted border border-border">
                      <BookOpen className="h-5 w-5 text-muted-foreground" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    {post.category && (
                      <p className="text-[9px] font-bold uppercase tracking-widest text-orange-500 mb-0.5">{post.category}</p>
                    )}
                    <p className="text-xs font-semibold text-foreground leading-snug line-clamp-2 group-hover:text-orange-600 transition-colors">{post.title}</p>
                    <p className="mt-0.5 text-[10px] text-muted-foreground">
                      {new Date(post.date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                    </p>
                  </div>
                  <ChevronRight className="h-3.5 w-3.5 flex-shrink-0 mt-1 text-muted-foreground group-hover:text-orange-500 transition-colors" />
                </button>
              </li>
            ))}
          </ul>
        )}

        {!loading && posts.length > 0 && (
          <div className="border-t border-border px-4 py-2.5">
            <a href="https://observerfile.com" target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-orange-600 transition-colors">
              More on ObserverFile <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        )}
      </div>

      {selected && <ArticleModal post={selected} onClose={() => setSelected(null)} />}
    </>
  )
}
