"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { useAuth, useUser, useClerk } from "@clerk/nextjs"
import {
  CATEGORIES,
  totalPromises,
  type PromiseStatus,
  type Promise as PromiseType,
  type Category,
  type TimelineUpdate,
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
  Plus,
  ExternalLink,
  Calendar,
  LogIn,
  Zap,
  Search,
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
const TIMELINE_STORAGE_KEY = "bhorosha-tracker-timeline-v1"

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

function loadTimelines(): Record<string, TimelineUpdate[]> {
  if (typeof window === "undefined") return {}
  try {
    const stored = localStorage.getItem(TIMELINE_STORAGE_KEY)
    return stored ? JSON.parse(stored) : {}
  } catch {
    return {}
  }
}

function saveTimelines(timelines: Record<string, TimelineUpdate[]>) {
  if (typeof window === "undefined") return
  localStorage.setItem(TIMELINE_STORAGE_KEY, JSON.stringify(timelines))
}

// API functions for database operations
async function fetchStatusesFromDB(): Promise<Record<string, PromiseStatus>> {
  try {
    const response = await fetch("/api/promises/statuses")
    if (!response.ok) throw new Error("Failed to fetch statuses")
    return response.json()
  } catch (error) {
    console.error("[v0] Error fetching statuses from DB:", error)
    return loadStatuses() // Fallback to localStorage
  }
}

async function updateStatusInDB(promiseId: string, status: PromiseStatus, userId: string | null): Promise<void> {
  try {
    const response = await fetch("/api/promises/statuses", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ promiseId, status, userId }),
    })
    if (!response.ok) throw new Error("Failed to update status")
  } catch (error) {
    console.error("[v0] Error updating status in DB:", error)
  }
}

async function fetchTimelineUpdatesFromDB(promiseId: string): Promise<TimelineUpdate[]> {
  try {
    const response = await fetch(`/api/promises/updates?promiseId=${promiseId}`)
    if (!response.ok) throw new Error("Failed to fetch updates")
    const data = await response.json()
    // Convert to TimelineUpdate format
    return data.map((item: any) => ({
      id: item.id,
      title: item.title,
      link: item.link,
      description: item.description,
      timestamp: item.created_at,
    }))
  } catch (error) {
    console.error("[v0] Error fetching updates from DB:", error)
    return []
  }
}

async function submitTimelineUpdateToDB(
  promiseId: string,
  update: Omit<TimelineUpdate, "id" | "timestamp">
): Promise<void> {
  try {
    const response = await fetch("/api/promises/updates", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ promiseId, ...update }),
    })
    if (!response.ok) throw new Error("Failed to submit update")
  } catch (error) {
    console.error("[v0] Error submitting update to DB:", error)
    throw error
  }
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

  // Weighted progress: Fulfilled = 1 point, In Progress = 0.5 points, Broken/Pending = 0
  const progressPercent = total > 0 ? Math.round(((fulfilled * 1 + inProgress * 0.5) / total) * 100) : 0

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
            color={progressPercent === 100 ? "#16a34a" : "#c2410c"}
          />
          <span className="absolute inset-0 flex items-center justify-center text-sm font-black text-foreground">
            {progressPercent}%
          </span>
        </div>

        {/* Category Info */}
        <div className="min-w-0 flex-1">
          <h3 className="truncate font-serif text-lg font-black text-foreground">{category.name}</h3>
          <p className="text-xs font-medium text-muted-foreground">{category.bengali}</p>
          
          {/* Status Summary Counts */}
          <div className="mt-2 flex items-center gap-3 text-xs font-bold">
            {fulfilled > 0 && (
              <span className="flex items-center gap-1 text-green-600">
                <span className="h-2.5 w-2.5 rounded-full bg-green-500" />
                {fulfilled}
              </span>
            )}
            {inProgress > 0 && (
              <span className="flex items-center gap-1 text-amber-600">
                <span className="h-2.5 w-2.5 rounded-full bg-amber-500" />
                {inProgress}
              </span>
            )}
            {broken > 0 && (
              <span className="flex items-center gap-1 text-red-600">
                <span className="h-2.5 w-2.5 rounded-full bg-red-500" />
                {broken}
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

      {/* Promises Preview - Always visible colored dots grid */}
      <div className="border-t border-border bg-muted/20 px-4 py-3">
        <div className="flex flex-wrap gap-1.5">
          {category.promises.map((promise) => {
            const status = statuses[promise.id] || "pending"
            const colorMap: Record<PromiseStatus, string> = {
              pending: "bg-neutral-300",
              "in-progress": "bg-amber-500",
              fulfilled: "bg-green-500",
              broken: "bg-red-500",
            }
            return (
              <button
                key={promise.id}
                onClick={(e) => {
                  e.stopPropagation()
                  onPromiseSelect(promise, category)
                }}
                className={`h-4 w-4 rounded-sm ${colorMap[status]} transition-transform hover:scale-125 active:scale-110`}
                title={promise.title}
              />
            )
          })}
        </div>
        <p className="mt-2 text-[10px] font-medium text-muted-foreground">
          Tap any square to view and update status
        </p>
      </div>

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
  timeline,
  onStatusChange,
  onAddUpdate,
  onClose,
  onShare,
  isSignedIn,
  userId,
  isAdmin,
}: {
  promise: PromiseType
  category: Category
  status: PromiseStatus
  timeline: TimelineUpdate[]
  onStatusChange: (status: PromiseStatus) => void
  onAddUpdate: (update: Omit<TimelineUpdate, "id" | "timestamp">) => void
  onClose: () => void
  onShare: () => void
  isSignedIn: boolean
  userId: string | null
  isAdmin: boolean
}) {
  const { user } = useUser()
  const { openSignIn } = useClerk()
  const config = STATUS_CONFIG[status]
  const [showAddForm, setShowAddForm] = useState(false)
  const [formTitle, setFormTitle] = useState("")
  const [formLink, setFormLink] = useState("")
  const [formDescription, setFormDescription] = useState("")
  const [titleError, setTitleError] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState("")
  const [submitSuccess, setSubmitSuccess] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitError("")
    setSubmitSuccess("")
    
    if (!isSignedIn) {
      setSubmitError("Please sign in to submit updates")
      openSignIn()
      return
    }

    // Validate title (max 10 words)
    const wordCount = formTitle.trim().split(/\s+/).filter(Boolean).length
    if (wordCount > 10) {
      setTitleError("Title must be 10 words or less")
      return
    }
    if (!formTitle.trim() || !formLink.trim()) {
      return
    }

    setSubmitting(true)
    try {
      const response = await fetch("/api/promises/updates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          promiseId: promise.id,
          title: formTitle.trim(),
          link: formLink.trim(),
          description: formDescription.trim() || undefined,
          userName: user?.firstName || "Anonymous",
          userEmail: user?.primaryEmailAddress?.emailAddress || null,
          userId: userId,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Failed to submit update")
      }

      setSubmitSuccess("Update submitted for review! Thank you for your contribution.")
      setFormTitle("")
      setFormLink("")
      setFormDescription("")
      setTitleError("")
      
      setTimeout(() => {
        setShowAddForm(false)
        setSubmitSuccess("")
      }, 2000)
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : "Failed to submit update")
    } finally {
      setSubmitting(false)
    }
  }

  const formatDate = (timestamp: string) => {
    const date = new Date(timestamp)
    return date.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

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
        <span className="rounded-full bg-orange-600 px-4 py-1.5 text-xs font-black uppercase text-white">
          {category.bengali}
        </span>
        <button
          onClick={onShare}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-orange-600 text-white transition-colors active:scale-95"
        >
          <Share2 className="h-5 w-5" />
        </button>
      </header>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-6">
          <h1 className="font-serif text-3xl font-black leading-tight text-foreground text-balance">
            {promise.title}
          </h1>

          {promise.detail && (
            <p className="mt-4 text-base leading-relaxed text-muted-foreground text-pretty">
              {promise.detail}
            </p>
          )}

          {/* Current Status Display */}
          <div className="mt-6">
            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
              Current Status
            </p>
            <div
              className={`mt-2 inline-flex items-center gap-2 rounded-full border-2 px-4 py-2 ${config.bgColor} ${config.borderColor}`}
            >
              {(() => {
                const Icon = config.icon
                return <Icon className={`h-5 w-5 ${config.color}`} />
              })()}
              <span className={`text-base font-black ${config.color}`}>{config.label}</span>
            </div>
          </div>
        </div>

        {/* Timeline Section */}
        <div className="border-t-2 border-border bg-muted/30 px-6 py-5">
          <div className="flex items-center justify-between">
            <h2 className="font-serif text-lg font-black text-foreground">Updates Timeline</h2>
            {isSignedIn ? (
              <button
                onClick={() => setShowAddForm(!showAddForm)}
                className="flex items-center gap-1.5 rounded-full bg-orange-600 px-4 py-2 text-sm font-bold text-white transition-colors active:scale-95"
              >
                <Plus className="h-4 w-4" />
                Add Update
              </button>
            ) : (
              <button
                onClick={() => openSignIn()}
                className="flex items-center gap-1.5 rounded-full bg-blue-600 px-4 py-2 text-sm font-bold text-white transition-colors active:scale-95"
              >
                <LogIn className="h-4 w-4" />
                Sign In
              </button>
            )}
          </div>

          {/* Add Update Form */}
          {showAddForm && isSignedIn && (
            <form onSubmit={handleSubmit} className="mt-4 rounded-xl border-2 border-border bg-card p-4">
              {submitError && (
                <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm font-medium text-red-700">
                  {submitError}
                </div>
              )}
              {submitSuccess && (
                <div className="mb-4 rounded-lg bg-green-50 p-3 text-sm font-medium text-green-700">
                  {submitSuccess}
                </div>
              )}
              <div className="space-y-4">
                <div>
                  <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-muted-foreground">
                    Title <span className="text-red-500">*</span>
                    <span className="ml-1 normal-case tracking-normal text-muted-foreground/70">(max 10 words)</span>
                  </label>
                  <input
                    type="text"
                    value={formTitle}
                    onChange={(e) => {
                      setFormTitle(e.target.value)
                      setTitleError("")
                    }}
                    placeholder="e.g., Government announces new policy"
                    className="w-full rounded-lg border-2 border-border bg-background px-4 py-3 text-base text-foreground placeholder:text-muted-foreground/50 focus:border-orange-500 focus:outline-none"
                    required
                    disabled={submitting}
                  />
                  {titleError && <p className="mt-1 text-sm text-red-500">{titleError}</p>}
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-muted-foreground">
                    Article Link <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="url"
                    value={formLink}
                    onChange={(e) => setFormLink(e.target.value)}
                    placeholder="https://example.com/article"
                    className="w-full rounded-lg border-2 border-border bg-background px-4 py-3 text-base text-foreground placeholder:text-muted-foreground/50 focus:border-orange-500 focus:outline-none"
                    required
                    disabled={submitting}
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-muted-foreground">
                    Description <span className="text-muted-foreground/70">(optional)</span>
                  </label>
                  <textarea
                    value={formDescription}
                    onChange={(e) => setFormDescription(e.target.value)}
                    placeholder="Brief summary of the update..."
                    rows={3}
                    className="w-full resize-none rounded-lg border-2 border-border bg-background px-4 py-3 text-base text-foreground placeholder:text-muted-foreground/50 focus:border-orange-500 focus:outline-none"
                  />
                </div>

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddForm(false)
                      setFormTitle("")
                      setFormLink("")
                      setFormDescription("")
                      setTitleError("")
                      setSubmitError("")
                      setSubmitSuccess("")
                    }}
                    className="flex-1 rounded-lg border-2 border-border px-4 py-3 text-sm font-bold text-muted-foreground transition-colors hover:bg-muted active:scale-[0.98] disabled:opacity-50"
                    disabled={submitting}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 rounded-lg bg-orange-600 px-4 py-3 text-sm font-bold text-white transition-colors active:scale-[0.98] disabled:opacity-50"
                    disabled={submitting}
                  >
                    {submitting ? "Submitting..." : "Submit Update"}
                  </button>
                </div>
              </div>
            </form>
          )}

          {/* Timeline List */}
          {timeline.length > 0 ? (
            <div className="mt-4 space-y-3">
              {timeline.map((update) => (
                <div
                  key={update.id}
                  className="relative rounded-xl border-2 border-border bg-card p-4 pl-5"
                >
                  {/* Timeline line indicator */}
                  <div className="absolute left-0 top-0 bottom-0 w-1 rounded-l-xl bg-orange-500" />
                  
                  <div className="flex items-start gap-3">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-foreground leading-snug">{update.title}</h3>
                      {update.description && (
                        <p className="mt-1 text-sm text-muted-foreground line-clamp-2">{update.description}</p>
                      )}
                      <div className="mt-2 flex flex-wrap items-center gap-3">
                        <a
                          href={update.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-sm font-medium text-orange-600 hover:underline"
                        >
                          <ExternalLink className="h-3.5 w-3.5" />
                          Read Article
                        </a>
                        <span className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Calendar className="h-3 w-3" />
                          {formatDate(update.timestamp)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="mt-4 rounded-xl border-2 border-dashed border-border bg-muted/50 p-6 text-center">
              <p className="text-sm text-muted-foreground">No updates yet. Add the first update!</p>
            </div>
          )}
        </div>
      </div>

      {/* Status Actions */}
      <div className="flex-shrink-0 border-t-4 border-orange-500 bg-card px-4 pb-6 pt-4">
        {isSignedIn && userId ? (
          <>
            <p className="mb-3 text-center text-xs font-bold uppercase tracking-widest text-muted-foreground">
              Update Status
            </p>
            {!isAdmin && (
              <p className="mb-4 text-center text-xs text-orange-600 font-medium">
                Admin access required to change status
              </p>
            )}
            <div className="grid grid-cols-2 gap-2">
              {(["pending", "in-progress", "fulfilled", "broken"] as PromiseStatus[]).map((s) => {
                const c = STATUS_CONFIG[s]
                const Icon = c.icon
                const isActive = status === s
                return (
                  <button
                    key={s}
                    onClick={() => onStatusChange(s)}
                    disabled={!isAdmin}
                    className={`flex items-center gap-2 rounded-xl border-2 p-3 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed ${
                      isActive
                        ? `${c.bgColor} ${c.borderColor} shadow-lg`
                        : "border-border bg-card hover:border-muted-foreground/30"
                    }`}
                  >
                    <Icon className={`h-5 w-5 ${isActive ? c.color : "text-muted-foreground"}`} />
                    <div className="text-left">
                      <span
                        className={`block text-sm font-black ${isActive ? c.color : "text-foreground"}`}
                      >
                        {c.label}
                      </span>
                    </div>
                  </button>
                )
              })}
            </div>
          </>
        ) : (
          <div className="rounded-lg bg-blue-50 p-4 text-center">
            <p className="text-sm font-bold text-blue-700">Sign in to manage promises</p>
            <p className="mt-1 text-xs text-blue-600">Only admins can update promise statuses</p>
          </div>
        )}
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

// Latest Updates Auto-Scroll Slider
function LatestUpdatesSlider({
  updates,
  onSelectPromise,
}: {
  updates: Array<{
    id: string
    promise_id: string
    title: string
    link: string
    submitted_by: string | null
    created_at: string
  }>
  onSelectPromise: (promise: PromiseType, category: Category) => void
}) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const isPausedRef = useRef(false)
  const animFrameRef = useRef<number | null>(null)

  // Resolve each update to its promise + category
  const resolved = updates.flatMap((update) => {
    for (const cat of CATEGORIES) {
      const p = cat.promises.find((p) => p.id === update.promise_id)
      if (p) return [{ update, promise: p, category: cat }]
    }
    return []
  })

  useEffect(() => {
    const el = scrollRef.current
    if (!el || resolved.length === 0) return

    let pos = 0
    const speed = 0.3 // px per frame
    const maxScroll = el.scrollWidth - el.clientWidth

    function step() {
      if (!isPausedRef.current && el && maxScroll > 0) {
        pos += speed
        // Reset to start when reached the end
        if (pos >= maxScroll) pos = 0
        el.scrollLeft = pos
      }
      animFrameRef.current = requestAnimationFrame(step)
    }

    animFrameRef.current = requestAnimationFrame(step)
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current)
    }
  }, [resolved.length])

  const items = resolved

  return (
    <div className="border-b border-border bg-gradient-to-r from-orange-50/60 via-background to-orange-50/60">
      {/* Header */}
      <div className="flex items-center gap-2 px-4 pt-3 pb-2">
        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-orange-500">
          <Zap className="h-3 w-3 text-white" />
        </span>
        <span className="text-[11px] font-black uppercase tracking-widest text-muted-foreground">
          Latest Updates
        </span>
        <span className="ml-auto text-[10px] text-muted-foreground/60 font-medium">
          {resolved.length} new
        </span>
      </div>

      {/* Scrolling strip */}
      <div
        ref={scrollRef}
        className="flex gap-3 overflow-x-hidden pb-4 px-4"
        style={{ scrollbarWidth: "none", WebkitOverflowScrolling: "touch" }}
        onMouseEnter={() => { isPausedRef.current = true }}
        onMouseLeave={() => { isPausedRef.current = false }}
        onTouchStart={() => { isPausedRef.current = true }}
        onTouchEnd={() => { isPausedRef.current = false }}
      >
        {items.map(({ update, promise, category }, i) => (
          <button
            key={`${update.id}-${i}`}
            onClick={() => onSelectPromise(promise, category)}
            className="group relative flex w-[65vw] max-w-[280px] flex-shrink-0 flex-col justify-between rounded-2xl border border-border bg-card p-4 text-left shadow-sm transition-all hover:border-orange-400 hover:shadow-md active:scale-[0.98]"
          >
            {/* Category tag */}
            <div className="mb-3 flex items-center justify-between">
              <span className="rounded-full bg-orange-500 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wide text-white">
                {category.bengali}
              </span>
              <span className="text-[10px] text-muted-foreground">
                {new Date(update.created_at).toLocaleDateString("en-IN", {
                  day: "numeric",
                  month: "short",
                })}
              </span>
            </div>

            {/* Update title */}
            <p className="line-clamp-2 text-sm font-bold leading-snug text-foreground transition-colors group-hover:text-orange-600">
              {update.title}
            </p>

            {/* Promise name */}
            <p className="mt-2 line-clamp-1 text-[11px] text-muted-foreground">
              Re: {promise.title}
            </p>

            {/* Bottom accent bar */}
            <div className="absolute bottom-0 left-0 right-0 h-0.5 rounded-b-2xl bg-orange-500 opacity-0 transition-opacity group-hover:opacity-100" />
          </button>
        ))}
      </div>
    </div>
  )
}

// Main Component
export default function PromiseTracker() {
  const { isSignedIn, userId } = useAuth()
  const [statuses, setStatuses] = useState<Record<string, PromiseStatus>>({})
  const [timelines, setTimelines] = useState<Record<string, TimelineUpdate[]>>({})
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set())
  const [selectedPromise, setSelectedPromise] = useState<{
    promise: PromiseType
    category: Category
  } | null>(null)
  const [showShareModal, setShowShareModal] = useState(false)
  const [hydrated, setHydrated] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("all")
  const [latestUpdates, setLatestUpdates] = useState<Array<{
    id: string
    promise_id: string
    title: string
    link: string
    submitted_by: string | null
    created_at: string
  }>>([])

  // Fetch latest approved updates for the slider
  useEffect(() => {
    async function fetchLatestUpdates() {
      try {
        const res = await fetch("/api/promises/latest-updates")
        if (res.ok) {
          const data = await res.json()
          setLatestUpdates(data)
        }
      } catch (error) {
        console.error("[v0] Error fetching latest updates:", error)
      }
    }
    fetchLatestUpdates()
  }, [])

  // Check admin status
  useEffect(() => {
    async function checkAdminStatus() {
      if (userId) {
        try {
          const response = await fetch(`/api/auth/is-admin?userId=${userId}`)
          const data = await response.json()
          setIsAdmin(data.isAdmin)
        } catch (error) {
          console.error("[v0] Error checking admin status:", error)
          setIsAdmin(false)
        }
      } else {
        setIsAdmin(false)
      }
    }
    checkAdminStatus()
  }, [userId])

  // Load statuses and timelines from database
  useEffect(() => {
    async function initializeData() {
      const dbStatuses = await fetchStatusesFromDB()
      setStatuses(dbStatuses)
      setHydrated(true)
    }
    initializeData()
  }, [])

  // Save statuses to database
  useEffect(() => {
    if (hydrated && Object.keys(statuses).length > 0) {
      saveStatuses(statuses)
    }
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

  // Weighted progress: Fulfilled = 1 point, In Progress = 0.5 points, Broken/Pending = 0
  const overallProgress =
    total > 0 ? Math.round(((stats.fulfilled * 1 + stats.inProgress * 0.5) / total) * 100) : 0

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
    // Update in database with userId
    updateStatusInDB(promiseId, status, userId)
  }, [userId])

  const handleAddTimelineUpdate = useCallback(
    (promiseId: string, update: Omit<TimelineUpdate, "id" | "timestamp">) => {
      // Submit to database (goes to pending/moderation)
      submitTimelineUpdateToDB(promiseId, update).then(() => {
        // Refresh timeline from database
        fetchTimelineUpdatesFromDB(promiseId).then((updates) => {
          setTimelines((prev) => ({
            ...prev,
            [promiseId]: updates,
          }))
        })
      })
    },
    []
  )

  return (
    <div className="min-h-dvh bg-background pb-8">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b-4 border-green-600 bg-orange-600 px-4 py-4">
        <div className="mx-auto max-w-2xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-t-xl rounded-br-sm bg-white text-3xl font-black text-orange-600" style={{ fontFamily: '"Oswald", sans-serif', boxShadow: 'inset 0px 4px 6px 0px rgba(154, 172, 203, 0.98)' }}>
                ভ
              </div>
              <div>
                <h1 className="font-serif text-2xl font-black leading-none tracking-tight text-white">
                  BHOROSHA
                </h1>
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/80">
                  BJP West Bengal Tracker
                </p>
                {/* Days in Power */}
                <div className="mt-2.5 inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5 backdrop-blur-sm">
                  <span className="h-2 w-2 rounded-full bg-white/80" />
                  <span className="text-xs font-bold text-white">
                    {Math.floor((new Date().getTime() - new Date(2026, 4, 9).getTime()) / (1000 * 60 * 60 * 24))} Days in Power
                  </span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowShareModal(true)}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-orange-600 transition-colors active:scale-95"
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
                color={overallProgress >= 50 ? "#16a34a" : "#c2410c"}
              />
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-2xl font-black text-foreground">{overallProgress}%</span>
                <span className="text-[10px] font-medium text-muted-foreground">Progress</span>
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid flex-1 grid-cols-2 gap-3">
              <div className="rounded-xl bg-green-50 p-3">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                  <span className="text-2xl font-black text-green-700">{stats.fulfilled}</span>
                </div>
                <p className="text-xs font-medium text-green-600">Fulfilled</p>
              </div>
              <div className="rounded-xl bg-amber-50 p-3">
                <div className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-amber-600" />
                  <span className="text-2xl font-black text-amber-700">{stats.inProgress}</span>
                </div>
                <p className="text-xs font-medium text-amber-600">In Progress</p>
              </div>
              <div className="rounded-xl bg-red-50 p-3">
                <div className="flex items-center gap-2">
                  <XCircle className="h-5 w-5 text-red-600" />
                  <span className="text-2xl font-black text-red-700">{stats.broken}</span>
                </div>
                <p className="text-xs font-medium text-red-600">Broken</p>
              </div>
              <div className="rounded-xl bg-neutral-100 p-3">
                <div className="flex items-center gap-2">
                  <Circle className="h-5 w-5 text-neutral-500" />
                  <span className="text-2xl font-black text-neutral-600">{stats.pending}</span>
                </div>
                <p className="text-xs font-medium text-neutral-500">Not Rated</p>
              </div>
            </div>
          </div>

          {/* Total Promises */}
          <p className="mt-4 text-center text-sm font-medium text-muted-foreground">
            Tracking <span className="font-black text-foreground">{total}</span> manifesto promises
          </p>
        </div>
      </div>

      {/* Latest Updates Slider */}
      {latestUpdates.length > 0 && (
        <LatestUpdatesSlider
          updates={latestUpdates}
          onSelectPromise={(promise, category) => {
            setSelectedPromise({ promise, category })
            fetchTimelineUpdatesFromDB(promise.id).then((updates) => {
              setTimelines((prev) => ({ ...prev, [promise.id]: updates }))
            })
          }}
        />
      )}

      {/* Category Cards */}
      <div className="mx-auto max-w-2xl px-4 pt-6">
        {/* Header row: title + search + filter */}
        <div className="mb-4 flex flex-col gap-3">
          <h2 className="font-serif text-xl font-black text-foreground">Categories</h2>
          <div className="flex items-center gap-2">
            {/* Search input */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search promises..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-9 w-full rounded-xl border border-border bg-card pl-8 pr-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-orange-400 focus:outline-none focus:ring-1 focus:ring-orange-400"
              />
            </div>
            {/* Category dropdown */}
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="h-9 flex-shrink-0 rounded-xl border border-border bg-card px-3 text-sm font-medium text-foreground focus:border-orange-400 focus:outline-none focus:ring-1 focus:ring-orange-400"
            >
              <option value="all">All</option>
              {CATEGORIES.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.bengali}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex flex-col gap-4">
          {CATEGORIES
            .filter((category) =>
              categoryFilter === "all" ? true : category.id === categoryFilter
            )
            .filter((category) => {
              if (!searchQuery.trim()) return true
              const q = searchQuery.toLowerCase()
              return (
                category.name.toLowerCase().includes(q) ||
                category.bengali.toLowerCase().includes(q) ||
                category.promises.some((p) => p.title.toLowerCase().includes(q))
              )
            })
            .map((category) => (
              <CategoryCard
                key={category.id}
                category={category}
                statuses={statuses}
                isExpanded={expandedCategories.has(category.id) || (searchQuery.trim().length > 0)}
                onToggle={() => toggleCategory(category.id)}
                onPromiseSelect={(promise, cat) => {
                  setSelectedPromise({ promise, category: cat })
                  fetchTimelineUpdatesFromDB(promise.id).then((updates) => {
                    setTimelines((prev) => ({ ...prev, [promise.id]: updates }))
                  })
                }}
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
          timeline={timelines[selectedPromise.promise.id] || []}
          onStatusChange={(s) => handleStatusChange(selectedPromise.promise.id, s)}
          onAddUpdate={(update) => handleAddTimelineUpdate(selectedPromise.promise.id, update)}
          onClose={() => setSelectedPromise(null)}
          onShare={() => setShowShareModal(true)}
          isSignedIn={isSignedIn ?? false}
          userId={userId ?? null}
          isAdmin={isAdmin}
        />
      )}

      {/* Share Modal */}
      {showShareModal && <ShareModal stats={stats} onClose={() => setShowShareModal(false)} />}

      {/* Footer - How to Read */}
      <footer className="border-t-2 border-border bg-card px-4 py-6">
        <div className="mx-auto max-w-2xl">
          <h3 className="font-serif text-lg font-black text-foreground">How to Read This Tracker</h3>
          <div className="mt-4 space-y-3">
            <div className="flex items-start gap-3">
              <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-green-500 text-xs font-bold text-white">1</span>
              <p className="text-sm text-muted-foreground">
                <span className="font-bold text-green-600">Fulfilled</span> = Promise completed (1 point)
              </p>
            </div>
            <div className="flex items-start gap-3">
              <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-amber-500 text-xs font-bold text-white">0.5</span>
              <p className="text-sm text-muted-foreground">
                <span className="font-bold text-amber-600">In Progress</span> = Work started but not complete (0.5 points)
              </p>
            </div>
            <div className="flex items-start gap-3">
              <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white">0</span>
              <p className="text-sm text-muted-foreground">
                <span className="font-bold text-red-600">Broken</span> = Promise not kept or reversed (0 points)
              </p>
            </div>
            <div className="flex items-start gap-3">
              <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-neutral-400 text-xs font-bold text-white">0</span>
              <p className="text-sm text-muted-foreground">
                <span className="font-bold text-neutral-500">Not Rated</span> = No action taken yet (0 points)
              </p>
            </div>
          </div>
          <div className="mt-4 rounded-lg bg-muted/50 p-3">
            <p className="text-xs text-muted-foreground">
              <span className="font-bold">Progress Formula:</span> (Fulfilled x 1 + In Progress x 0.5) / Total Promises x 100
            </p>
          </div>
          <div className="mt-6 grid grid-cols-2 gap-4 rounded-lg border border-border bg-muted/30 p-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Ruling Party</p>
              <p className="mt-1 text-sm font-black text-foreground">BJP</p>
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Contact Admin</p>
              <a
                href="mailto:toddwake666@gmail.com"
                className="mt-1 text-sm font-semibold text-orange-600 hover:text-orange-700 transition-colors"
              >
                toddwake666@gmail.com
              </a>
            </div>
          </div>
          <p className="mt-4 text-center text-xs text-muted-foreground">
            Bhorosha Tracker - Citizen-powered accountability for West Bengal
          </p>
        </div>
      </footer>
    </div>
  )
}
