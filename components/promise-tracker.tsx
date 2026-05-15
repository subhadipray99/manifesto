"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import {
  CATEGORIES,
  STATUS_META,
  STATUS_ORDER,
  totalPromises,
  type PromiseStatus,
  type Promise as PromiseType,
} from "@/lib/promises-data"
import {
  Circle,
  Clock,
  CheckCircle2,
  XCircle,
  Share2,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  X,
} from "lucide-react"

const STATUS_CONFIG: Record<
  PromiseStatus,
  { label: string; labelBn: string; color: string; bgColor: string; borderColor: string; icon: typeof Circle }
> = {
  pending: {
    label: "Not Started",
    labelBn: "শুরু হয়নি",
    color: "text-neutral-500",
    bgColor: "bg-neutral-100",
    borderColor: "border-neutral-300",
    icon: Circle,
  },
  "in-progress": {
    label: "In Progress",
    labelBn: "চলমান",
    color: "text-amber",
    bgColor: "bg-amber/15",
    borderColor: "border-amber/50",
    icon: Clock,
  },
  fulfilled: {
    label: "Fulfilled",
    labelBn: "পূর্ণ",
    color: "text-green",
    bgColor: "bg-green/15",
    borderColor: "border-green/50",
    icon: CheckCircle2,
  },
  broken: {
    label: "Broken",
    labelBn: "ভঙ্গ",
    color: "text-red",
    bgColor: "bg-red/15",
    borderColor: "border-red/50",
    icon: XCircle,
  },
}

const STORAGE_KEY = "bhorosha-tracker-statuses-v2"

function loadStatuses(): Record<string, PromiseStatus> {
  if (typeof window === "undefined") return {}
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    return stored ? JSON.parse(stored) : {}
  } catch {
    return {}
  }
}

function saveStatuses(statuses: Record<string, PromiseStatus>) {
  if (typeof window === "undefined") return
  localStorage.setItem(STORAGE_KEY, JSON.stringify(statuses))
}

// Flatten all promises with category info
const allPromises = CATEGORIES.flatMap((cat) =>
  cat.promises.map((p) => ({ ...p, categoryId: cat.id, categoryName: cat.name, categoryBn: cat.bengali }))
)

export default function PromiseTracker() {
  const [statuses, setStatuses] = useState<Record<string, PromiseStatus>>({})
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isAnimating, setIsAnimating] = useState(false)
  const [swipeDirection, setSwipeDirection] = useState<"left" | "right" | null>(null)
  const [showShareModal, setShowShareModal] = useState(false)
  const [touchStart, setTouchStart] = useState<{ x: number; y: number } | null>(null)
  const [touchDelta, setTouchDelta] = useState(0)
  const [hydrated, setHydrated] = useState(false)
  const pillBarRef = useRef<HTMLDivElement>(null)

  // Load statuses from localStorage
  useEffect(() => {
    setStatuses(loadStatuses())
    setHydrated(true)
  }, [])

  // Save statuses
  useEffect(() => {
    if (hydrated) saveStatuses(statuses)
  }, [statuses, hydrated])

  // Filter promises by category
  const filteredPromises = selectedCategory
    ? allPromises.filter((p) => p.categoryId === selectedCategory)
    : allPromises

  const currentPromise = filteredPromises[currentIndex]

  // Stats calculation
  const total = totalPromises()
  const stats = {
    total,
    pending: allPromises.filter((p) => (statuses[p.id] || "pending") === "pending").length,
    inProgress: allPromises.filter((p) => statuses[p.id] === "in-progress").length,
    fulfilled: allPromises.filter((p) => statuses[p.id] === "fulfilled").length,
    broken: allPromises.filter((p) => statuses[p.id] === "broken").length,
  }

  const handleStatusChange = useCallback(
    (status: PromiseStatus) => {
      if (!currentPromise || isAnimating) return

      const newStatuses = { ...statuses, [currentPromise.id]: status }
      setStatuses(newStatuses)

      // Auto-advance to next card after a brief delay
      if (currentIndex < filteredPromises.length - 1) {
        setSwipeDirection("left")
        setIsAnimating(true)
        setTimeout(() => {
          setCurrentIndex((prev) => prev + 1)
          setSwipeDirection(null)
          setIsAnimating(false)
        }, 280)
      }
    },
    [currentPromise, statuses, currentIndex, filteredPromises.length, isAnimating]
  )

  const goToPrevious = useCallback(() => {
    if (currentIndex > 0 && !isAnimating) {
      setSwipeDirection("right")
      setIsAnimating(true)
      setTimeout(() => {
        setCurrentIndex((prev) => prev - 1)
        setSwipeDirection(null)
        setIsAnimating(false)
      }, 280)
    }
  }, [currentIndex, isAnimating])

  const goToNext = useCallback(() => {
    if (currentIndex < filteredPromises.length - 1 && !isAnimating) {
      setSwipeDirection("left")
      setIsAnimating(true)
      setTimeout(() => {
        setCurrentIndex((prev) => prev + 1)
        setSwipeDirection(null)
        setIsAnimating(false)
      }, 280)
    }
  }, [currentIndex, filteredPromises.length, isAnimating])

  // Touch handlers for swipe
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart({ x: e.touches[0].clientX, y: e.touches[0].clientY })
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!touchStart) return
    const deltaX = e.touches[0].clientX - touchStart.x
    setTouchDelta(deltaX)
  }

  const handleTouchEnd = () => {
    if (Math.abs(touchDelta) > 80) {
      if (touchDelta > 0) {
        goToPrevious()
      } else {
        goToNext()
      }
    }
    setTouchStart(null)
    setTouchDelta(0)
  }

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") goToPrevious()
      if (e.key === "ArrowRight") goToNext()
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [goToPrevious, goToNext])

  const handleCategoryChange = (categoryId: string | null) => {
    setSelectedCategory(categoryId)
    setCurrentIndex(0)
  }

  const generateShareText = () => {
    const rated = stats.fulfilled + stats.inProgress + stats.broken
    return `BHOROSHA TRACKER | BJP West Bengal

${stats.fulfilled} Fulfilled
${stats.inProgress} In Progress
${stats.broken} Broken
${stats.pending} Not Rated

${rated}/${stats.total} promises tracked

Track yourself:`
  }

  const handleShare = async (platform: "twitter" | "whatsapp" | "copy") => {
    const text = generateShareText()
    const url = typeof window !== "undefined" ? window.location.href : ""

    if (platform === "twitter") {
      window.open(
        `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`,
        "_blank"
      )
    } else if (platform === "whatsapp") {
      window.open(`https://wa.me/?text=${encodeURIComponent(text + " " + url)}`, "_blank")
    } else if (platform === "copy") {
      await navigator.clipboard.writeText(text + " " + url)
      alert("Copied to clipboard!")
    }
    setShowShareModal(false)
  }

  const resetAllStatuses = () => {
    if (confirm("Reset all promise statuses? This cannot be undone.")) {
      setStatuses({})
      localStorage.removeItem(STORAGE_KEY)
      setCurrentIndex(0)
    }
  }

  if (!currentPromise) {
    return (
      <div className="flex h-dvh items-center justify-center bg-background p-4">
        <div className="text-center">
          <p className="text-lg font-semibold text-foreground">No promises in this category</p>
          <button
            onClick={() => handleCategoryChange(null)}
            className="mt-4 rounded-full bg-saffron px-6 py-3 font-bold text-white active:scale-95"
          >
            View All Promises
          </button>
        </div>
      </div>
    )
  }

  const currentStatus = statuses[currentPromise.id] || "pending"

  return (
    <div className="flex h-dvh flex-col bg-background">
      {/* Header */}
      <header className="flex-shrink-0 bg-saffron px-4 py-3 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/20 font-serif text-2xl font-black">
              B
            </div>
            <div>
              <h1 className="font-serif text-xl font-black leading-tight tracking-tight">BHOROSHA</h1>
              <p className="text-[10px] font-bold uppercase tracking-widest text-white/80">BJP West Bengal Tracker</p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={resetAllStatuses}
              className="flex h-10 w-10 items-center justify-center rounded-full text-white/80 transition-colors hover:bg-white/20 active:scale-95"
              title="Reset all statuses"
            >
              <RotateCcw className="h-5 w-5" />
            </button>
            <button
              onClick={() => setShowShareModal(true)}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-saffron transition-colors active:scale-95"
              title="Share progress"
            >
              <Share2 className="h-5 w-5" />
            </button>
          </div>
        </div>
      </header>

      {/* Stats Strip */}
      <div className="flex-shrink-0 border-b-4 border-green bg-foreground px-4 py-2.5">
        <div className="flex items-center justify-between text-xs text-white">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5">
              <span className="h-3 w-3 rounded-full bg-green" />
              <span className="font-bold">{stats.fulfilled}</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-3 w-3 rounded-full bg-amber" />
              <span className="font-bold">{stats.inProgress}</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-3 w-3 rounded-full bg-red" />
              <span className="font-bold">{stats.broken}</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-3 w-3 rounded-full bg-white/40" />
              <span className="font-medium text-white/70">{stats.pending}</span>
            </span>
          </div>
          <span className="font-mono font-bold">
            {currentIndex + 1} / {filteredPromises.length}
          </span>
        </div>
      </div>

      {/* Category Pills - Floating Bar */}
      <div className="flex-shrink-0 bg-muted/50">
        <div
          ref={pillBarRef}
          className="flex gap-2 overflow-x-auto px-4 py-3"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          <button
            onClick={() => handleCategoryChange(null)}
            className={`flex-shrink-0 rounded-full px-4 py-2.5 text-sm font-bold transition-all active:scale-95 ${
              selectedCategory === null
                ? "bg-saffron text-white shadow-lg shadow-saffron/30"
                : "bg-white text-foreground shadow-sm hover:shadow-md"
            }`}
          >
            ALL ({allPromises.length})
          </button>
          {CATEGORIES.map((category) => {
            const count = category.promises.length
            return (
              <button
                key={category.id}
                onClick={() => handleCategoryChange(category.id)}
                className={`flex-shrink-0 whitespace-nowrap rounded-full px-4 py-2.5 text-sm font-bold transition-all active:scale-95 ${
                  selectedCategory === category.id
                    ? "bg-saffron text-white shadow-lg shadow-saffron/30"
                    : "bg-white text-foreground shadow-sm hover:shadow-md"
                }`}
              >
                {category.name.toUpperCase()} ({count})
              </button>
            )
          })}
        </div>
      </div>

      {/* Card Stack Area */}
      <div className="relative flex-1 overflow-hidden">
        {/* Navigation Arrows - Desktop */}
        <button
          onClick={goToPrevious}
          disabled={currentIndex === 0 || isAnimating}
          className="absolute left-3 top-1/2 z-20 hidden h-14 w-14 -translate-y-1/2 items-center justify-center rounded-full bg-white shadow-xl transition-all disabled:opacity-30 active:scale-95 md:flex"
        >
          <ChevronLeft className="h-7 w-7 text-foreground" />
        </button>
        <button
          onClick={goToNext}
          disabled={currentIndex >= filteredPromises.length - 1 || isAnimating}
          className="absolute right-3 top-1/2 z-20 hidden h-14 w-14 -translate-y-1/2 items-center justify-center rounded-full bg-white shadow-xl transition-all disabled:opacity-30 active:scale-95 md:flex"
        >
          <ChevronRight className="h-7 w-7 text-foreground" />
        </button>

        {/* Card Stack */}
        <div
          className="relative mx-auto h-full max-w-lg px-6 py-5"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          {/* Background cards for stack effect */}
          {filteredPromises.slice(currentIndex + 1, currentIndex + 3).map((_, i) => (
            <div
              key={`bg-${i}`}
              className="absolute inset-x-6 top-5 h-[calc(100%-2.5rem)] rounded-3xl border-2 border-border bg-card"
              style={{
                transform: `scale(${0.94 - i * 0.04}) translateY(${(i + 1) * 14}px)`,
                opacity: 0.5 - i * 0.2,
                zIndex: -i - 1,
              }}
            />
          ))}

          {/* Main Card */}
          <div
            className={`relative h-full rounded-3xl border-4 bg-card shadow-2xl transition-transform duration-300 ease-out ${
              swipeDirection === "left"
                ? "-translate-x-[120%] rotate-[-12deg] opacity-0"
                : swipeDirection === "right"
                  ? "translate-x-[120%] rotate-[12deg] opacity-0"
                  : ""
            } ${STATUS_CONFIG[currentStatus].borderColor}`}
            style={{
              transform:
                touchDelta !== 0 && !swipeDirection
                  ? `translateX(${touchDelta}px) rotate(${touchDelta * 0.04}deg)`
                  : undefined,
            }}
          >
            <div className="flex h-full flex-col p-5">
              {/* Category Badge */}
              <div className="mb-4 flex items-center justify-between">
                <span className="rounded-full bg-saffron px-4 py-1.5 text-xs font-black uppercase tracking-wide text-white">
                  {currentPromise.categoryBn}
                </span>
                <span className="font-mono text-sm font-bold text-muted-foreground">
                  #{currentIndex + 1}
                </span>
              </div>

              {/* Promise Content */}
              <div className="flex-1 overflow-y-auto">
                <h2 className="font-serif text-2xl font-black leading-tight text-foreground text-balance sm:text-3xl">
                  {currentPromise.title}
                </h2>
                {currentPromise.detail && (
                  <p className="mt-4 text-base leading-relaxed text-muted-foreground text-pretty">
                    {currentPromise.detail}
                  </p>
                )}
              </div>

              {/* Current Status Badge */}
              <div className="mt-4 flex items-center justify-center pt-2">
                <div
                  className={`flex items-center gap-2 rounded-full border-2 px-5 py-2.5 ${STATUS_CONFIG[currentStatus].bgColor} ${STATUS_CONFIG[currentStatus].borderColor}`}
                >
                  {(() => {
                    const Icon = STATUS_CONFIG[currentStatus].icon
                    return <Icon className={`h-5 w-5 ${STATUS_CONFIG[currentStatus].color}`} />
                  })()}
                  <span className={`font-bold ${STATUS_CONFIG[currentStatus].color}`}>
                    {STATUS_CONFIG[currentStatus].label}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Swipe hint - mobile */}
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 text-[10px] font-medium uppercase tracking-widest text-muted-foreground md:hidden">
            Swipe to navigate
          </div>
        </div>
      </div>

      {/* Status Action Bar */}
      <div className="flex-shrink-0 border-t-4 border-saffron bg-card px-4 pb-6 pt-4">
        <p className="mb-3 text-center text-xs font-bold uppercase tracking-widest text-muted-foreground">
          Mark this promise
        </p>
        <div className="grid grid-cols-4 gap-2">
          {(["pending", "in-progress", "fulfilled", "broken"] as PromiseStatus[]).map((status) => {
            const config = STATUS_CONFIG[status]
            const Icon = config.icon
            const isActive = currentStatus === status
            return (
              <button
                key={status}
                onClick={() => handleStatusChange(status)}
                disabled={isAnimating}
                className={`flex flex-col items-center gap-1.5 rounded-2xl border-3 p-3 transition-all active:scale-95 disabled:opacity-50 ${
                  isActive
                    ? `${config.bgColor} ${config.borderColor} shadow-lg`
                    : "border-transparent bg-muted hover:bg-muted/80"
                }`}
              >
                <Icon className={`h-7 w-7 ${isActive ? config.color : "text-muted-foreground"}`} />
                <span
                  className={`text-[10px] font-black uppercase leading-tight ${isActive ? config.color : "text-muted-foreground"}`}
                >
                  {config.labelBn}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Share Modal */}
      {showShareModal && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-4 backdrop-blur-sm sm:items-center"
          onClick={() => setShowShareModal(false)}
        >
          <div
            className="w-full max-w-md rounded-t-3xl bg-card p-6 sm:rounded-3xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-2 flex justify-center sm:hidden">
              <div className="h-1.5 w-14 rounded-full bg-muted" />
            </div>
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-serif text-2xl font-black text-foreground">Share Progress</h3>
                <p className="text-sm text-muted-foreground">Show the world how BJP is doing</p>
              </div>
              <button
                onClick={() => setShowShareModal(false)}
                className="rounded-full p-2 text-muted-foreground hover:bg-muted"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Preview */}
            <div className="mt-4 rounded-2xl bg-foreground p-4 text-sm text-white">
              <p className="font-black">BHOROSHA TRACKER</p>
              <p className="mt-2 font-mono text-white/80">
                {stats.fulfilled} Fulfilled | {stats.inProgress} In Progress | {stats.broken} Broken
              </p>
              <p className="font-mono text-white/60">{stats.pending} Not Yet Rated</p>
            </div>

            <div className="mt-4 grid grid-cols-3 gap-3">
              <button
                onClick={() => handleShare("twitter")}
                className="flex flex-col items-center gap-2 rounded-2xl bg-[#1DA1F2] p-4 text-white transition-all active:scale-95"
              >
                <svg className="h-7 w-7" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
                <span className="text-xs font-bold">Twitter</span>
              </button>
              <button
                onClick={() => handleShare("whatsapp")}
                className="flex flex-col items-center gap-2 rounded-2xl bg-[#25D366] p-4 text-white transition-all active:scale-95"
              >
                <svg className="h-7 w-7" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                </svg>
                <span className="text-xs font-bold">WhatsApp</span>
              </button>
              <button
                onClick={() => handleShare("copy")}
                className="flex flex-col items-center gap-2 rounded-2xl bg-muted p-4 text-foreground transition-all active:scale-95"
              >
                <svg className="h-7 w-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2" strokeWidth="2" />
                  <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" strokeWidth="2" />
                </svg>
                <span className="text-xs font-bold">Copy</span>
              </button>
            </div>

            <button
              onClick={() => setShowShareModal(false)}
              className="mt-4 w-full rounded-2xl bg-muted py-3.5 font-bold text-muted-foreground transition-all active:scale-95"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
