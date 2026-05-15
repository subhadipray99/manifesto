"use client"

import { useState, useEffect, useCallback } from "react"
import {
  CATEGORIES,
  totalPromises,
  type PromiseStatus,
  type Promise as PromiseType,
  type Category,
} from "@/lib/promises-data"
import {
  Circle,
  Clock,
  CheckCircle2,
  XCircle,
  Share2,
  ChevronDown,
  ChevronUp,
  X,
  ArrowLeft,
  RotateCcw,
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
    color: "text-amber-600",
    bgColor: "bg-amber-50",
    borderColor: "border-amber-300",
    icon: Clock,
  },
  fulfilled: {
    label: "Fulfilled",
    labelBn: "পূর্ণ",
    color: "text-green-600",
    bgColor: "bg-green-50",
    borderColor: "border-green-300",
    icon: CheckCircle2,
  },
  broken: {
    label: "Broken",
    labelBn: "ভঙ্গ",
    color: "text-red-600",
    bgColor: "bg-red-50",
    borderColor: "border-red-300",
    icon: XCircle,
  },
}

const STORAGE_KEY = "bhorosha-tracker-statuses-v3"

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

// Progress Ring Component
function ProgressRing({
  percent,
  size = 56,
  strokeWidth = 5,
  color,
}: {
  percent: number
  size?: number
  strokeWidth?: number
  color: string
}) {
  const radius = (size - strokeWidth) / 2
  const circumference = radius * 2 * Math.PI
  const offset = circumference - (percent / 100) * circumference

  return (
    <svg width={size} height={size} className="rotate-[-90deg]">
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        className="text-muted/50"
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        className="transition-all duration-500 ease-out"
      />
    </svg>
  )
}

// Category Progress Card
function CategoryCard({
  category,
  statuses,
  isExpanded,
  onToggle,
  onPromiseSelect,
}: {
  category: Category
  statuses: Record<string, PromiseStatus>
  isExpanded: boolean
  onToggle: () => void
  onPromiseSelect: (promise: PromiseType, category: Category) => void
}) {
  const total = category.promises.length
  const fulfilled = category.promises.filter((p) => statuses[p.id] === "fulfilled").length
  const inProgress = category.promises.filter((p) => statuses[p.id] === "in-progress").length
  const broken = category.promises.filter((p) => statuses[p.id] === "broken").length
  const pending = total - fulfilled - inProgress - broken

  const progressPercent = total > 0 ? Math.round(((fulfilled + inProgress) / total) * 100) : 0

  return (
    <div className="overflow-hidden rounded-2xl border-2 border-border bg-card transition-all">
      {/* Card Header - Tap to expand */}
      <button
        onClick={onToggle}
        className="flex w-full items-center gap-4 p-4 text-left transition-colors active:bg-muted/50"
      >
        {/* Progress Ring */}
        <div className="relative flex-shrink-0">
          <ProgressRing
            percent={progressPercent}
            color={progressPercent === 100 ? "var(--green)" : "var(--saffron)"}
          />
          <span className="absolute inset-0 flex items-center justify-center text-sm font-black text-foreground">
            {progressPercent}%
          </span>
        </div>

        {/* Category Info */}
        <div className="min-w-0 flex-1">
          <h3 className="truncate font-serif text-lg font-black text-foreground">{category.name}</h3>
          <p className="text-xs font-medium text-muted-foreground">{category.bengali}</p>
          
          {/* Mini Status Pills */}
          <div className="mt-2 flex flex-wrap gap-1.5">
            {fulfilled > 0 && (
              <span className="flex items-center gap-1 rounded-full bg-green/15 px-2 py-0.5 text-[10px] font-bold text-green">
                <CheckCircle2 className="h-3 w-3" />
                {fulfilled}
              </span>
            )}
            {inProgress > 0 && (
              <span className="flex items-center gap-1 rounded-full bg-amber/15 px-2 py-0.5 text-[10px] font-bold text-amber">
                <Clock className="h-3 w-3" />
                {inProgress}
              </span>
            )}
            {broken > 0 && (
              <span className="flex items-center gap-1 rounded-full bg-red/15 px-2 py-0.5 text-[10px] font-bold text-red">
                <XCircle className="h-3 w-3" />
                {broken}
              </span>
            )}
            {pending > 0 && (
              <span className="flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-[10px] font-bold text-muted-foreground">
                <Circle className="h-3 w-3" />
                {pending}
              </span>
            )}
          </div>
        </div>

        {/* Expand Icon */}
        <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-muted">
          {isExpanded ? (
            <ChevronUp className="h-5 w-5 text-foreground" />
          ) : (
            <ChevronDown className="h-5 w-5 text-foreground" />
          )}
        </div>
      </button>

      {/* Expanded Promises List */}
      {isExpanded && (
        <div className="border-t-2 border-border bg-muted/30">
          <ul className="divide-y divide-border">
            {category.promises.map((promise) => {
              const status = statuses[promise.id] || "pending"
              const config = STATUS_CONFIG[status]
              const Icon = config.icon

              return (
                <li key={promise.id}>
                  <button
                    onClick={() => onPromiseSelect(promise, category)}
                    className="flex w-full items-start gap-3 p-4 text-left transition-colors active:bg-muted/70"
                  >
                    <div
                      className={`mt-0.5 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg ${config.bgColor}`}
                    >
                      <Icon className={`h-4 w-4 ${config.color}`} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold leading-snug text-foreground text-pretty">{promise.title}</p>
                      <p className={`mt-1 text-xs font-medium ${config.color}`}>{config.label}</p>
                    </div>
                  </button>
                </li>
              )
            })}
          </ul>
        </div>
      )}
    </div>
  )
}

// Promise Detail View
function PromiseDetail({
  promise,
  category,
  status,
  onStatusChange,
  onClose,
  onShare,
}: {
  promise: PromiseType
  category: Category
  status: PromiseStatus
  onStatusChange: (status: PromiseStatus) => void
  onClose: () => void
  onShare: () => void
}) {
  const config = STATUS_CONFIG[status]

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-background">
      {/* Header */}
      <header className="flex flex-shrink-0 items-center justify-between border-b-2 border-border bg-card px-4 py-3">
        <button
          onClick={onClose}
          className="flex h-10 w-10 items-center justify-center rounded-full transition-colors hover:bg-muted active:scale-95"
        >
          <ArrowLeft className="h-5 w-5 text-foreground" />
        </button>
        <span className="rounded-full bg-saffron px-4 py-1.5 text-xs font-black uppercase text-white">
          {category.bengali}
        </span>
        <button
          onClick={onShare}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-saffron text-white transition-colors active:scale-95"
        >
          <Share2 className="h-5 w-5" />
        </button>
      </header>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        <h1 className="font-serif text-3xl font-black leading-tight text-foreground text-balance">
          {promise.title}
        </h1>

        {promise.detail && (
          <p className="mt-6 text-lg leading-relaxed text-muted-foreground text-pretty">
            {promise.detail}
          </p>
        )}

        {/* Current Status Display */}
        <div className="mt-8">
          <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
            Current Status
          </p>
          <div
            className={`mt-3 inline-flex items-center gap-2 rounded-full border-2 px-5 py-3 ${config.bgColor} ${config.borderColor}`}
          >
            {(() => {
              const Icon = config.icon
              return <Icon className={`h-6 w-6 ${config.color}`} />
            })()}
            <span className={`text-lg font-black ${config.color}`}>{config.label}</span>
          </div>
        </div>
      </div>

      {/* Status Actions */}
      <div className="flex-shrink-0 border-t-4 border-saffron bg-card px-4 pb-8 pt-5">
        <p className="mb-4 text-center text-xs font-bold uppercase tracking-widest text-muted-foreground">
          Update Status
        </p>
        <div className="grid grid-cols-2 gap-3">
          {(["pending", "in-progress", "fulfilled", "broken"] as PromiseStatus[]).map((s) => {
            const c = STATUS_CONFIG[s]
            const Icon = c.icon
            const isActive = status === s
            return (
              <button
                key={s}
                onClick={() => onStatusChange(s)}
                className={`flex items-center gap-3 rounded-2xl border-2 p-4 transition-all active:scale-[0.98] ${
                  isActive
                    ? `${c.bgColor} ${c.borderColor} shadow-lg`
                    : "border-border bg-card hover:border-muted-foreground/30"
                }`}
              >
                <Icon className={`h-6 w-6 ${isActive ? c.color : "text-muted-foreground"}`} />
                <div className="text-left">
                  <span
                    className={`block text-sm font-black ${isActive ? c.color : "text-foreground"}`}
                  >
                    {c.label}
                  </span>
                  <span className={`block text-xs ${isActive ? c.color : "text-muted-foreground"}`}>
                    {c.labelBn}
                  </span>
                </div>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}

// Share Modal
function ShareModal({
  stats,
  onClose,
}: {
  stats: { total: number; fulfilled: number; inProgress: number; broken: number; pending: number }
  onClose: () => void
}) {
  const generateShareText = () => {
    return `BHOROSHA TRACKER | BJP West Bengal

${stats.fulfilled} Fulfilled
${stats.inProgress} In Progress
${stats.broken} Broken
${stats.pending} Not Rated

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
    onClose()
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-4 backdrop-blur-sm sm:items-center"
      onClick={onClose}
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
            <p className="text-sm text-muted-foreground">Show how BJP is tracking</p>
          </div>
          <button onClick={onClose} className="rounded-full p-2 text-muted-foreground hover:bg-muted">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Preview Card */}
        <div className="mt-4 rounded-2xl bg-foreground p-4 text-white">
          <p className="font-black">BHOROSHA TRACKER</p>
          <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
            <div className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-full bg-green" />
              <span>{stats.fulfilled} Fulfilled</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-full bg-amber" />
              <span>{stats.inProgress} In Progress</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-full bg-red" />
              <span>{stats.broken} Broken</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-full bg-white/40" />
              <span className="text-white/70">{stats.pending} Not Rated</span>
            </div>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-3 gap-3">
          <button
            onClick={() => handleShare("twitter")}
            className="flex flex-col items-center gap-2 rounded-2xl bg-[#1DA1F2] p-4 text-white transition-all active:scale-95"
          >
            <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
            </svg>
            <span className="text-xs font-bold">Twitter</span>
          </button>
          <button
            onClick={() => handleShare("whatsapp")}
            className="flex flex-col items-center gap-2 rounded-2xl bg-[#25D366] p-4 text-white transition-all active:scale-95"
          >
            <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
            </svg>
            <span className="text-xs font-bold">WhatsApp</span>
          </button>
          <button
            onClick={() => handleShare("copy")}
            className="flex flex-col items-center gap-2 rounded-2xl bg-foreground p-4 text-white transition-all active:scale-95"
          >
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
              />
            </svg>
            <span className="text-xs font-bold">Copy</span>
          </button>
        </div>
      </div>
    </div>
  )
}

// Main Component
export default function PromiseTracker() {
  const [statuses, setStatuses] = useState<Record<string, PromiseStatus>>({})
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set())
  const [selectedPromise, setSelectedPromise] = useState<{
    promise: PromiseType
    category: Category
  } | null>(null)
  const [showShareModal, setShowShareModal] = useState(false)
  const [hydrated, setHydrated] = useState(false)

  // Load statuses
  useEffect(() => {
    setStatuses(loadStatuses())
    setHydrated(true)
  }, [])

  // Save statuses
  useEffect(() => {
    if (hydrated) saveStatuses(statuses)
  }, [statuses, hydrated])

  // Stats
  const allPromises = CATEGORIES.flatMap((c) => c.promises)
  const total = totalPromises()
  const stats = {
    total,
    fulfilled: allPromises.filter((p) => statuses[p.id] === "fulfilled").length,
    inProgress: allPromises.filter((p) => statuses[p.id] === "in-progress").length,
    broken: allPromises.filter((p) => statuses[p.id] === "broken").length,
    pending: allPromises.filter((p) => (statuses[p.id] || "pending") === "pending").length,
  }

  const overallProgress =
    total > 0 ? Math.round(((stats.fulfilled + stats.inProgress) / total) * 100) : 0

  const toggleCategory = useCallback((categoryId: string) => {
    setExpandedCategories((prev) => {
      const next = new Set(prev)
      if (next.has(categoryId)) {
        next.delete(categoryId)
      } else {
        next.add(categoryId)
      }
      return next
    })
  }, [])

  const handleStatusChange = useCallback((promiseId: string, status: PromiseStatus) => {
    setStatuses((prev) => ({ ...prev, [promiseId]: status }))
  }, [])

  const resetAllStatuses = () => {
    if (confirm("Reset all promise statuses? This cannot be undone.")) {
      setStatuses({})
      localStorage.removeItem(STORAGE_KEY)
    }
  }

  return (
    <div className="min-h-dvh bg-background pb-8">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b-4 border-green bg-saffron px-4 py-4">
        <div className="mx-auto max-w-2xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white font-serif text-2xl font-black text-saffron">
                B
              </div>
              <div>
                <h1 className="font-serif text-2xl font-black leading-none tracking-tight text-white">
                  BHOROSHA
                </h1>
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/80">
                  BJP West Bengal Tracker
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={resetAllStatuses}
                className="flex h-10 w-10 items-center justify-center rounded-full text-white/80 transition-colors hover:bg-white/20 active:scale-95"
                title="Reset all"
              >
                <RotateCcw className="h-5 w-5" />
              </button>
              <button
                onClick={() => setShowShareModal(true)}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-saffron transition-colors active:scale-95"
                title="Share"
              >
                <Share2 className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Overall Progress Hero */}
      <div className="border-b-2 border-border bg-card px-4 py-6">
        <div className="mx-auto max-w-2xl">
          <div className="flex items-center gap-6">
            {/* Large Progress Ring */}
            <div className="relative flex-shrink-0">
              <ProgressRing
                percent={overallProgress}
                size={100}
                strokeWidth={8}
                color={overallProgress >= 50 ? "var(--green)" : "var(--saffron)"}
              />
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-2xl font-black text-foreground">{overallProgress}%</span>
                <span className="text-[10px] font-medium text-muted-foreground">Progress</span>
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid flex-1 grid-cols-2 gap-3">
              <div className="rounded-xl bg-green/10 p-3">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green" />
                  <span className="text-2xl font-black text-green">{stats.fulfilled}</span>
                </div>
                <p className="text-xs font-medium text-green/80">Fulfilled</p>
              </div>
              <div className="rounded-xl bg-amber/10 p-3">
                <div className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-amber" />
                  <span className="text-2xl font-black text-amber">{stats.inProgress}</span>
                </div>
                <p className="text-xs font-medium text-amber/80">In Progress</p>
              </div>
              <div className="rounded-xl bg-red/10 p-3">
                <div className="flex items-center gap-2">
                  <XCircle className="h-5 w-5 text-red" />
                  <span className="text-2xl font-black text-red">{stats.broken}</span>
                </div>
                <p className="text-xs font-medium text-red/80">Broken</p>
              </div>
              <div className="rounded-xl bg-muted p-3">
                <div className="flex items-center gap-2">
                  <Circle className="h-5 w-5 text-muted-foreground" />
                  <span className="text-2xl font-black text-muted-foreground">{stats.pending}</span>
                </div>
                <p className="text-xs font-medium text-muted-foreground/80">Not Rated</p>
              </div>
            </div>
          </div>

          {/* Total Promises */}
          <p className="mt-4 text-center text-sm font-medium text-muted-foreground">
            Tracking <span className="font-black text-foreground">{total}</span> manifesto promises
          </p>
        </div>
      </div>

      {/* Category Cards */}
      <div className="mx-auto max-w-2xl px-4 pt-6">
        <h2 className="mb-4 font-serif text-xl font-black text-foreground">Categories</h2>
        <div className="flex flex-col gap-4">
          {CATEGORIES.map((category) => (
            <CategoryCard
              key={category.id}
              category={category}
              statuses={statuses}
              isExpanded={expandedCategories.has(category.id)}
              onToggle={() => toggleCategory(category.id)}
              onPromiseSelect={(promise, cat) => setSelectedPromise({ promise, category: cat })}
            />
          ))}
        </div>
      </div>

      {/* Promise Detail View */}
      {selectedPromise && (
        <PromiseDetail
          promise={selectedPromise.promise}
          category={selectedPromise.category}
          status={statuses[selectedPromise.promise.id] || "pending"}
          onStatusChange={(s) => handleStatusChange(selectedPromise.promise.id, s)}
          onClose={() => setSelectedPromise(null)}
          onShare={() => setShowShareModal(true)}
        />
      )}

      {/* Share Modal */}
      {showShareModal && <ShareModal stats={stats} onClose={() => setShowShareModal(false)} />}
    </div>
  )
}
