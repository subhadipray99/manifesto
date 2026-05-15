"use client"

import { useEffect, useMemo, useState } from "react"
import {
  CATEGORIES,
  STATUS_META,
  STATUS_ORDER,
  totalPromises,
  type PromiseStatus,
} from "@/lib/promises-data"
import { cn } from "@/lib/utils"
import {
  Check,
  ChevronDown,
  Filter,
  Share2,
  Twitter,
  Link2,
  MessageCircle,
  X,
  CircleDot,
  Circle,
  CircleCheck,
  CircleX,
  Search,
} from "lucide-react"

const STORAGE_KEY = "bjp-wb-promise-tracker-v1"

type StatusMap = Record<string, PromiseStatus>

function loadStatuses(): StatusMap {
  if (typeof window === "undefined") return {}
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : {}
  } catch {
    return {}
  }
}

function saveStatuses(map: StatusMap) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(map))
  } catch {}
}

const STATUS_ICON: Record<PromiseStatus, typeof Circle> = {
  pending: Circle,
  "in-progress": CircleDot,
  fulfilled: CircleCheck,
  broken: CircleX,
}

export default function PromiseTracker() {
  const [statuses, setStatuses] = useState<StatusMap>({})
  const [hydrated, setHydrated] = useState(false)
  const [activeFilter, setActiveFilter] = useState<PromiseStatus | "all">("all")
  const [openCats, setOpenCats] = useState<Record<string, boolean>>({})
  const [query, setQuery] = useState("")
  const [shareOpen, setShareOpen] = useState<null | { kind: "promise"; id: string } | { kind: "summary" }>(null)

  useEffect(() => {
    setStatuses(loadStatuses())
    setHydrated(true)
  }, [])

  useEffect(() => {
    if (hydrated) saveStatuses(statuses)
  }, [statuses, hydrated])

  const getStatus = (id: string): PromiseStatus => statuses[id] ?? "pending"

  const setStatus = (id: string, s: PromiseStatus) =>
    setStatuses((prev) => ({ ...prev, [id]: s }))

  const counts = useMemo(() => {
    const c = { pending: 0, "in-progress": 0, fulfilled: 0, broken: 0 } as Record<PromiseStatus, number>
    for (const cat of CATEGORIES) for (const p of cat.promises) c[getStatus(p.id)]++
    return c
  }, [statuses])

  const total = totalPromises()
  const fulfilledPct = Math.round((counts.fulfilled / total) * 100)
  const inProgressPct = Math.round((counts["in-progress"] / total) * 100)
  const brokenPct = Math.round((counts.broken / total) * 100)

  const filteredCategories = useMemo(() => {
    const q = query.trim().toLowerCase()
    return CATEGORIES.map((cat) => {
      const promises = cat.promises.filter((p) => {
        if (activeFilter !== "all" && getStatus(p.id) !== activeFilter) return false
        if (q && !(`${p.title} ${p.detail}`.toLowerCase().includes(q))) return false
        return true
      })
      return { ...cat, promises }
    }).filter((c) => c.promises.length > 0)
  }, [activeFilter, query, statuses])

  const toggleCat = (id: string) =>
    setOpenCats((prev) => ({ ...prev, [id]: !(prev[id] ?? true) }))

  const isOpen = (id: string) => openCats[id] ?? true

  return (
    <div className="min-h-dvh bg-background">
      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-border bg-background/85 backdrop-blur-md">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-3 px-4 py-3">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-foreground font-mono text-sm font-bold text-background">
              ভ
            </div>
            <div className="leading-tight">
              <div className="font-serif text-base font-semibold tracking-tight">Bhorosha Tracker</div>
              <div className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
                BJP · West Bengal · Manifesto 2026
              </div>
            </div>
          </div>
          <button
            onClick={() => setShareOpen({ kind: "summary" })}
            className="flex h-9 items-center gap-1.5 rounded-full border border-border bg-card px-3 text-xs font-medium hover:bg-muted active:scale-95 transition"
            aria-label="Share progress"
          >
            <Share2 className="h-3.5 w-3.5" />
            Share
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 pb-32 pt-5">
        {/* Hero / Summary */}
        <section className="mb-5">
          <div className="rounded-2xl border border-border bg-card p-5">
            <div className="flex items-baseline justify-between gap-2">
              <h1 className="font-serif text-2xl font-semibold leading-tight tracking-tight text-balance">
                Holding the <span className="text-primary-accent">promise</span> to account.
              </h1>
            </div>
            <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground text-pretty">
              A citizen-run tracker for every commitment in BJP&apos;s <em>Bhorosha-r Shopath</em>. Mark
              what&apos;s done, what&apos;s moving, and what&apos;s broken.
            </p>

            {/* Progress bar */}
            <div className="mt-5">
              <div className="flex h-2.5 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full bg-emerald-600 transition-[width] duration-500"
                  style={{ width: `${fulfilledPct}%` }}
                />
                <div
                  className="h-full bg-amber-500 transition-[width] duration-500"
                  style={{ width: `${inProgressPct}%` }}
                />
                <div
                  className="h-full bg-rose-600 transition-[width] duration-500"
                  style={{ width: `${brokenPct}%` }}
                />
              </div>
              <div className="mt-2 flex items-center justify-between text-[11px] text-muted-foreground">
                <span className="font-mono">
                  {counts.fulfilled}/{total} fulfilled
                </span>
                <span className="font-mono">{fulfilledPct}%</span>
              </div>
            </div>

            {/* Stat tiles */}
            <div className="mt-4 grid grid-cols-4 gap-2">
              {STATUS_ORDER.map((s) => {
                const meta = STATUS_META[s]
                const Icon = STATUS_ICON[s]
                const active = activeFilter === s
                return (
                  <button
                    key={s}
                    onClick={() => setActiveFilter(active ? "all" : s)}
                    className={cn(
                      "flex flex-col items-start gap-1 rounded-xl border p-2.5 text-left transition active:scale-95",
                      active
                        ? "border-foreground bg-foreground text-background"
                        : "border-border bg-card hover:bg-muted",
                    )}
                  >
                    <Icon className={cn("h-3.5 w-3.5", active ? "opacity-100" : "opacity-70")} />
                    <span className="font-mono text-lg font-semibold leading-none">{counts[s]}</span>
                    <span className="text-[10px] uppercase tracking-wider leading-tight opacity-80">
                      {meta.label}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>
        </section>

        {/* Search + filter row */}
        <section className="mb-4 flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              inputMode="search"
              placeholder="Search promises…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="h-11 w-full rounded-full border border-border bg-card pl-9 pr-9 text-sm placeholder:text-muted-foreground focus:border-foreground focus:outline-none"
            />
            {query && (
              <button
                onClick={() => setQuery("")}
                aria-label="Clear search"
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-1.5 text-muted-foreground hover:bg-muted"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
          {activeFilter !== "all" && (
            <button
              onClick={() => setActiveFilter("all")}
              className="flex h-11 shrink-0 items-center gap-1.5 rounded-full border border-foreground bg-foreground px-3.5 text-xs font-medium text-background"
            >
              <Filter className="h-3.5 w-3.5" />
              {STATUS_META[activeFilter].label}
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </section>

        {/* Categories */}
        <section className="space-y-3">
          {filteredCategories.length === 0 && (
            <div className="rounded-2xl border border-dashed border-border p-10 text-center">
              <p className="text-sm text-muted-foreground">No promises match this filter.</p>
            </div>
          )}

          {filteredCategories.map((cat, idx) => {
            const open = isOpen(cat.id)
            const catCounts = cat.promises.reduce(
              (acc, p) => {
                acc[getStatus(p.id)]++
                return acc
              },
              { pending: 0, "in-progress": 0, fulfilled: 0, broken: 0 } as Record<PromiseStatus, number>,
            )
            return (
              <article
                key={cat.id}
                className="overflow-hidden rounded-2xl border border-border bg-card"
              >
                <button
                  onClick={() => toggleCat(cat.id)}
                  className="flex w-full items-center gap-3 px-4 py-3.5 text-left active:bg-muted/60"
                  aria-expanded={open}
                >
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-border bg-background font-mono text-[11px] font-semibold tabular-nums">
                    {String(idx + 1).padStart(2, "0")}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <h2 className="truncate font-serif text-[15px] font-semibold leading-tight">
                        {cat.name}
                      </h2>
                      <span className="shrink-0 rounded-full bg-muted px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">
                        {cat.promises.length}
                      </span>
                    </div>
                    <div className="mt-0.5 flex items-center gap-2 text-[11px] text-muted-foreground">
                      <span className="truncate">{cat.bengali}</span>
                      <span className="opacity-40">·</span>
                      <span className="truncate">{cat.tagline}</span>
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    {STATUS_ORDER.filter((s) => catCounts[s] > 0).map((s) => (
                      <span
                        key={s}
                        className={cn("h-1.5 w-1.5 rounded-full", STATUS_META[s].dot)}
                        title={`${catCounts[s]} ${STATUS_META[s].label}`}
                      />
                    ))}
                    <ChevronDown
                      className={cn(
                        "ml-1 h-4 w-4 text-muted-foreground transition-transform",
                        open && "rotate-180",
                      )}
                    />
                  </div>
                </button>

                {open && (
                  <ul className="divide-y divide-border border-t border-border">
                    {cat.promises.map((p) => {
                      const status = getStatus(p.id)
                      const meta = STATUS_META[status]
                      const Icon = STATUS_ICON[status]
                      return (
                        <li key={p.id} className="px-4 py-4">
                          <div className="flex items-start gap-3">
                            <div
                              className={cn(
                                "mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full ring-1",
                                meta.ring,
                              )}
                            >
                              <Icon
                                className={cn(
                                  "h-4 w-4",
                                  status === "fulfilled" && "text-emerald-600",
                                  status === "in-progress" && "text-amber-600",
                                  status === "broken" && "text-rose-600",
                                  status === "pending" && "text-muted-foreground",
                                )}
                              />
                            </div>
                            <div className="min-w-0 flex-1">
                              <h3 className="text-[14.5px] font-medium leading-snug text-pretty">
                                {p.title}
                              </h3>
                              <p className="mt-1 text-[13px] leading-relaxed text-muted-foreground text-pretty">
                                {p.detail}
                              </p>

                              {/* Status chips */}
                              <div className="mt-3 -mx-1 flex flex-wrap gap-1.5 px-1">
                                {STATUS_ORDER.map((s) => {
                                  const m = STATUS_META[s]
                                  const selected = status === s
                                  return (
                                    <button
                                      key={s}
                                      onClick={() => setStatus(p.id, s)}
                                      className={cn(
                                        "flex h-8 items-center gap-1.5 rounded-full border px-2.5 text-[11.5px] font-medium transition active:scale-95 touch-manipulation",
                                        selected
                                          ? "border-foreground bg-foreground text-background"
                                          : "border-border bg-background text-muted-foreground hover:bg-muted",
                                      )}
                                      aria-pressed={selected}
                                    >
                                      <span
                                        className={cn(
                                          "h-1.5 w-1.5 rounded-full",
                                          selected ? "bg-background" : m.dot,
                                        )}
                                      />
                                      {m.label}
                                      {selected && <Check className="h-3 w-3" />}
                                    </button>
                                  )
                                })}
                                <button
                                  onClick={() => setShareOpen({ kind: "promise", id: p.id })}
                                  className="ml-auto flex h-8 items-center gap-1 rounded-full border border-border bg-background px-2.5 text-[11.5px] text-muted-foreground hover:bg-muted active:scale-95"
                                  aria-label="Share this promise"
                                >
                                  <Share2 className="h-3 w-3" />
                                  Share
                                </button>
                              </div>
                            </div>
                          </div>
                        </li>
                      )
                    })}
                  </ul>
                )}
              </article>
            )
          })}
        </section>

        <footer className="mt-10 border-t border-border pt-6">
          <p className="text-[11px] leading-relaxed text-muted-foreground text-balance">
            <strong className="font-medium text-foreground">Bhorosha Tracker</strong> is an
            independent, citizen-side tool to follow BJP&apos;s 2026 manifesto promises for West
            Bengal. Statuses are stored on your device — set them yourself, share with your
            community.
          </p>
        </footer>
      </main>

      {/* Share sheet */}
      {shareOpen && (
        <ShareSheet
          target={shareOpen}
          counts={counts}
          total={total}
          onClose={() => setShareOpen(null)}
        />
      )}
    </div>
  )
}

function ShareSheet({
  target,
  counts,
  total,
  onClose,
}: {
  target: { kind: "promise"; id: string } | { kind: "summary" }
  counts: Record<PromiseStatus, number>
  total: number
  onClose: () => void
}) {
  const [copied, setCopied] = useState(false)

  const promise =
    target.kind === "promise"
      ? CATEGORIES.flatMap((c) => c.promises).find((p) => p.id === target.id) ?? null
      : null

  const url = typeof window !== "undefined" ? window.location.href : ""

  const text =
    target.kind === "promise" && promise
      ? `📌 BJP WB Manifesto Promise:\n\n"${promise.title}"\n\n${promise.detail}\n\nTrack it on Bhorosha Tracker → ${url}`
      : `🪔 BJP West Bengal Manifesto — Promise Tracker\n\n✅ Fulfilled: ${counts.fulfilled}\n🟡 In Progress: ${counts["in-progress"]}\n🔴 Broken: ${counts.broken}\n⚪ Not Started: ${counts.pending}\n— of ${total} total promises.\n\nFollow along → ${url}`

  const tweetUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`
  const waUrl = `https://wa.me/?text=${encodeURIComponent(text)}`

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 1600)
    } catch {}
  }

  const nativeShare = async () => {
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({
          title: "Bhorosha Tracker",
          text,
          url,
        })
        onClose()
      } catch {}
    } else {
      copy()
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-foreground/40 backdrop-blur-sm sm:items-center"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-t-3xl border border-border bg-card p-5 sm:rounded-3xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-border sm:hidden" />
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-serif text-lg font-semibold leading-tight">
              {target.kind === "promise" ? "Share this promise" : "Share progress"}
            </h3>
            <p className="text-[12px] text-muted-foreground">
              {target.kind === "promise"
                ? "Let people know where this stands."
                : "Snapshot of how the manifesto is tracking."}
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="rounded-full p-2 text-muted-foreground hover:bg-muted"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <pre className="mt-4 max-h-44 overflow-y-auto whitespace-pre-wrap rounded-xl border border-border bg-muted/50 p-3 font-sans text-[12.5px] leading-relaxed text-foreground">
          {text}
        </pre>

        <div className="mt-4 grid grid-cols-2 gap-2">
          <a
            href={tweetUrl}
            target="_blank"
            rel="noreferrer"
            className="flex h-11 items-center justify-center gap-2 rounded-full border border-border bg-background text-sm font-medium hover:bg-muted active:scale-95"
          >
            <Twitter className="h-4 w-4" />
            Twitter / X
          </a>
          <a
            href={waUrl}
            target="_blank"
            rel="noreferrer"
            className="flex h-11 items-center justify-center gap-2 rounded-full border border-border bg-background text-sm font-medium hover:bg-muted active:scale-95"
          >
            <MessageCircle className="h-4 w-4" />
            WhatsApp
          </a>
          <button
            onClick={copy}
            className="flex h-11 items-center justify-center gap-2 rounded-full border border-border bg-background text-sm font-medium hover:bg-muted active:scale-95"
          >
            <Link2 className="h-4 w-4" />
            {copied ? "Copied!" : "Copy text"}
          </button>
          <button
            onClick={nativeShare}
            className="flex h-11 items-center justify-center gap-2 rounded-full bg-foreground text-sm font-medium text-background active:scale-95"
          >
            <Share2 className="h-4 w-4" />
            More…
          </button>
        </div>
      </div>
    </div>
  )
}
