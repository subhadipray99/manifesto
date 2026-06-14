"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { useAuth, useUser, useClerk } from "@clerk/nextjs"
import type { StateConfig, PromiseStatus, Promise as PromiseType, Category, TimelineUpdate } from "@/lib/states"
import { Circle, Clock, CircleCheck as CheckCircle2, Circle as XCircle, Share2, ChevronDown, ChevronUp, ChevronLeft, ChevronRight, X, ArrowLeft, Plus, ExternalLink, Calendar, LogIn, Zap, Search, Trophy, Menu, MapPin, Twitter, MessageSquare, Mail, Download } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { CommentsSection } from "@/components/comments-section"
import { NotificationBell } from "@/components/notification-bell"
import { ShortcutsModal } from "@/components/shortcuts-modal"
import { DonationModal } from "@/components/donation-modal"
import dynamic from "next/dynamic"

const ArticlesSection = dynamic(
  () => import("@/components/articles-section").then((m) => m.ArticlesSection),
  { ssr: false, loading: () => null }
)

import { NoticeCard } from "@/components/notice-card"



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

async function fetchStatusesFromDB(stateId: string): Promise<Record<string, PromiseStatus>> {
  try {
    const response = await fetch(`/api/promises/statuses?stateId=${stateId}`)
    if (!response.ok) throw new Error("Failed to fetch statuses")
    return response.json()
  } catch (error) {
    console.error("[v0] Error fetching statuses from DB:", error)
    return loadStatuses()
  }
}

async function updateStatusInDB(promiseId: string, status: PromiseStatus, userId: string | null, stateId: string): Promise<void> {
  try {
    const response = await fetch("/api/promises/statuses", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ promiseId, status, userId, stateId }),
    })
    if (!response.ok) throw new Error("Failed to update status")
  } catch (error) {
    console.error("[v0] Error updating status in DB:", error)
  }
}

async function fetchTimelineUpdatesFromDB(promiseId: string, stateId: string): Promise<TimelineUpdate[]> {
  try {
    const response = await fetch(`/api/promises/updates?promiseId=${promiseId}&stateId=${stateId}`)
    if (!response.ok) throw new Error("Failed to fetch updates")
    const data = await response.json()
    return data.map((item: any) => ({
      id: item.id,
      title: item.title,
      link: item.link,
      description: item.description,
      timestamp: item.created_at,
      created_at: item.created_at,
      submitted_by: item.submitted_by,
      user_id: item.user_id,
      username: item.username,
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
    <svg width={size} height={size} className="-rotate-90 transition-all duration-300">
      <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="currentColor" strokeWidth={strokeWidth} className="text-muted/50" />
      <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={offset} className="transition-all duration-500 ease-out" />
    </svg>
  )
}

function CategoryCard({
  category,
  statuses,
  isExpanded,
  onToggle,
  onPromiseSelect,
  onShare,
}: {
  category: Category
  statuses: Record<string, PromiseStatus>
  isExpanded: boolean
  onToggle: () => void
  onPromiseSelect: (promise: PromiseType, category: Category) => void
  onShare: () => void
}) {
  const total = category.promises.length
  const fulfilled = category.promises.filter((p) => statuses[p.id] === "fulfilled").length
  const inProgress = category.promises.filter((p) => statuses[p.id] === "in-progress").length
  const broken = category.promises.filter((p) => statuses[p.id] === "broken").length
  const progressPercent = total > 0 ? Math.round(((fulfilled * 1 + inProgress * 0.5) / total) * 100) : 0

  return (
    <div
      data-category-id={category.id}
      className="overflow-hidden rounded-2xl border hover:border-foreground/10 transition-all duration-200 hover:shadow-md border-border bg-card shadow-sm"
    >
      <button
        onClick={onToggle}
        className="flex w-full items-center gap-3 p-4 text-left transition-colors active:bg-muted/50 sm:p-5"
      >
        <div className="relative flex-shrink-0">
          <ProgressRing percent={progressPercent} size={50} strokeWidth={4} color={progressPercent === 100 ? "#16a34a" : "#c2410c"} />
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-[10px] font-black text-foreground">{progressPercent}%</span>
          </div>
        </div>

        <div className="min-w-0 flex-1">
          <h3 className="truncate font-serif text-base font-black text-foreground sm:text-lg">{category.name}</h3>
          {category.localName && (
            <p className="truncate text-[10px] font-medium text-muted-foreground sm:text-xs">{category.localName}</p>
          )}
          <div className="mt-1 flex items-center gap-2 text-[10px] font-bold sm:gap-3 sm:text-xs">
            {fulfilled > 0 && (
              <span className="flex items-center gap-1 text-green-600">
                <span className="h-2 w-2 flex-shrink-0 rounded-full bg-green-500 sm:h-2.5 sm:w-2.5" />
                <span>{fulfilled}</span>
              </span>
            )}
            {inProgress > 0 && (
              <span className="flex items-center gap-1 text-amber-600">
                <span className="h-2 w-2 flex-shrink-0 rounded-full bg-amber-500 sm:h-2.5 sm:w-2.5" />
                <span>{inProgress}</span>
              </span>
            )}
            {broken > 0 && (
              <span className="flex items-center gap-1 text-red-600">
                <span className="h-2 w-2 flex-shrink-0 rounded-full bg-red-500 sm:h-2.5 sm:w-2.5" />
                <span>{broken}</span>
              </span>
            )}
          </div>
        </div>

        <div className="flex gap-2 flex-shrink-0">
          <button
            onClick={(e) => {
              e.stopPropagation()
              onShare()
            }}
            className="flex h-9 w-9 items-center justify-center rounded-xl bg-muted/60 transition-colors hover:bg-orange-500/20 active:scale-95 sm:h-10 sm:w-10"
            title="Share category"
          >
            <Share2 className="h-4 w-4 text-foreground sm:h-5 sm:w-5" />
          </button>
          <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-muted/60 sm:h-10 sm:w-10">
            {isExpanded ? <ChevronUp className="h-4 w-4 text-foreground sm:h-5 sm:w-5" /> : <ChevronDown className="h-4 w-4 text-foreground sm:h-5 sm:w-5" />}
          </div>
        </div>
      </button>

      <div className="border-t border-border bg-muted/10 px-3 py-2 sm:px-4 sm:py-3">
        <div className="flex flex-wrap gap-1">
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
                className={`h-3.5 w-3.5 rounded-sm transition-transform active:scale-110 hover:shadow-sm sm:h-4 sm:w-4 sm:hover:scale-125 ${colorMap[status]}`}
                title={promise.title}
              />
            )
          })}
        </div>
        <p className="mt-2 text-[10px] font-medium text-muted-foreground">Tap any square to view and update status</p>
      </div>

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
                    <div className={`mt-0.5 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg ${config.bgColor}`}>
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

function FaviconLink({ url }: { url: string }) {
  const [imgError, setImgError] = useState(false)

  if (!url) return null

  try {
    const urlObj = new URL(url)
    const hostname = urlObj.hostname
    const displayName = hostname.replace(/^www\./, "")
    const faviconUrl = `https://www.google.com/s2/favicons?sz=32&domain=${hostname}`

    return (
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1.5 rounded-full border border-orange-200 bg-orange-50/50 px-2.5 py-1 text-xs font-semibold text-orange-700 hover:bg-orange-100 hover:border-orange-300 transition-all shadow-sm"
      >
        {!imgError ? (
          <img
            src={faviconUrl}
            alt=""
            className="h-3.5 w-3.5 rounded-sm object-contain"
            onError={() => setImgError(true)}
          />
        ) : (
          <ExternalLink className="h-3 w-3 text-orange-600" />
        )}
        <span>Read on {displayName}</span>
      </a>
    )
  } catch {
    return (
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1 text-sm font-medium text-orange-600 hover:underline"
      >
        <ExternalLink className="h-3.5 w-3.5" />
        <span>Read Article</span>
      </a>
    )
  }
}

function PromiseDetail({
  promise,
  category,
  status,
  timeline,
  stateId,
  onStatusChange,
  onAddUpdate,
  onClose,
  onShare,
  isSignedIn,
  userId,
  isAdmin,
  highlightCommentId,
}: {
  promise: PromiseType
  category: Category
  status: PromiseStatus
  timeline: TimelineUpdate[]
  stateId: string
  highlightCommentId?: string | null
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
  const [activeTab, setActiveTab] = useState<"updates" | "comments">("updates")
  const [showAddForm, setShowAddForm] = useState(false)
  const [formTitle, setFormTitle] = useState("")
  const [formLink, setFormLink] = useState("")
  const [formDescription, setFormDescription] = useState("")
  const [titleError, setTitleError] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState("")
  const [submitSuccess, setSubmitSuccess] = useState("")
  const [following, setFollowing] = useState(false)
  const [followLoading, setFollowLoading] = useState(false)

  useEffect(() => {
    if (!isSignedIn) return
    fetch(`/api/follows?promiseId=${promise.id}`)
      .then((r) => r.ok ? r.json() : null)
      .then((d) => d && setFollowing(d.following))
      .catch(() => {})
  }, [promise.id, isSignedIn])

  async function toggleFollow() {
    if (!isSignedIn) { openSignIn(); return }
    setFollowLoading(true)
    try {
      const res = following
        ? await fetch(`/api/follows?promiseId=${promise.id}`, { method: "DELETE" })
        : await fetch("/api/follows", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ promiseId: promise.id, stateId }),
          })
      if (res.ok) setFollowing((v) => !v)
    } catch { /* ignore */ } finally {
      setFollowLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitError("")
    setSubmitSuccess("")
    if (!isSignedIn) {
      setSubmitError("Please sign in to submit updates")
      openSignIn()
      return
    }
    const wordCount = formTitle.trim().split(/\s+/).filter(Boolean).length
    if (wordCount > 10) {
      setTitleError("Title must be 10 words or less")
      return
    }
    if (!formTitle.trim() || !formLink.trim()) return
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
          stateId: stateId,
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
    return date.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-background">
      <div className="flex-shrink-0 border-b border-border bg-card px-4 py-3">
        <div className="flex items-center gap-3">
          <button onClick={onClose} className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-muted transition-colors active:scale-95">
            <ArrowLeft className="h-5 w-5 text-foreground" />
          </button>
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-bold uppercase tracking-widest text-muted-foreground">{category.localName || category.name}</p>
          </div>
          <button
            onClick={toggleFollow}
            disabled={followLoading}
            className={`flex h-9 flex-shrink-0 items-center justify-center rounded-full px-4 text-xs font-bold transition-colors active:scale-95 disabled:opacity-50 ${following ? "bg-orange-500 text-white" : "border-2 border-border bg-muted text-foreground hover:border-orange-500 hover:text-orange-500"}`}
          >
            {followLoading ? "..." : following ? "Following" : "Follow"}
          </button>
          <button onClick={onShare} className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-muted transition-colors active:scale-95">
            <Share2 className="h-4 w-4 text-foreground" />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="p-4 sm:p-6">
          <h1 className="font-serif text-xl font-black leading-tight text-foreground text-balance sm:text-3xl">{promise.title}</h1>
          {promise.detail && (
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground text-pretty sm:mt-4 sm:text-base">{promise.detail}</p>
          )}
          <div className="mt-4 sm:mt-6">
            <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground sm:text-xs">Current Status</p>
            <div className={`mt-2 inline-flex items-center gap-2 rounded-full border-2 px-3 py-1.5 text-sm sm:px-4 sm:py-2 sm:text-base ${config.bgColor} ${config.borderColor}`}>
              {(() => { const Icon = config.icon; return <Icon className={`h-4 w-4 flex-shrink-0 sm:h-5 sm:w-5 ${config.color}`} /> })()}
              <span className={`font-black ${config.color}`}>{config.label}</span>
            </div>
          </div>
        </div>

        <div className="border-t-2 border-border bg-card">
          <div className="flex">
            <button
              onClick={() => setActiveTab("updates")}
              className={`flex flex-1 items-center justify-center gap-2 border-b-2 px-4 py-3 text-sm font-bold transition-colors ${activeTab === "updates" ? "border-orange-500 text-orange-600" : "border-transparent text-muted-foreground hover:text-foreground"}`}
            >
              <Calendar className="h-4 w-4" />
              Updates
            </button>
            <button
              onClick={() => setActiveTab("comments")}
              className={`flex flex-1 items-center justify-center gap-2 border-b-2 px-4 py-3 text-sm font-bold transition-colors ${activeTab === "comments" ? "border-orange-500 text-orange-600" : "border-transparent text-muted-foreground hover:text-foreground"}`}
            >
              <MessageSquare className="h-4 w-4" />
              Comments
            </button>
          </div>
        </div>

        {activeTab === "comments" ? (
          <CommentsSection promiseId={promise.id} stateId={stateId} isSignedIn={isSignedIn} isAdmin={isAdmin} highlightCommentId={highlightCommentId} />
        ) : (
        <div className="border-t-2 border-border bg-muted/30 px-4 py-4 sm:px-6 sm:py-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="font-serif text-base font-black text-foreground sm:text-lg">Updates Timeline</h2>
            {isSignedIn ? (
              <button onClick={() => setShowAddForm(!showAddForm)} className="flex items-center justify-center gap-1.5 rounded-full bg-gradient-to-r from-orange-600 to-orange-500 px-3 py-1.5 text-xs font-bold text-white transition-colors active:scale-95 sm:px-4 sm:py-2 sm:text-sm">
                <Plus className="h-4 w-4 flex-shrink-0" />
                <span>Add Update</span>
              </button>
            ) : (
              <button onClick={() => openSignIn()} className="flex items-center justify-center gap-1.5 rounded-full bg-blue-600 px-3 py-1.5 text-xs font-bold text-white transition-colors active:scale-95 sm:px-4 sm:py-2 sm:text-sm">
                <LogIn className="h-4 w-4 flex-shrink-0" />
                <span>Sign In to Add Updates</span>
              </button>
            )}
          </div>

          {showAddForm && isSignedIn && (
            <form onSubmit={handleSubmit} className="mt-4 rounded-xl border-2 border-border bg-card p-4">
              {submitError && <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm font-medium text-red-700">{submitError}</div>}
              {submitSuccess && <div className="mb-4 rounded-lg bg-green-50 p-3 text-sm font-medium text-green-700">{submitSuccess}</div>}
              <div className="space-y-4">
                <div>
                  <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-muted-foreground">
                    Title <span className="text-red-500">*</span>
                    <span className="ml-1 normal-case tracking-normal text-muted-foreground/70">(max 10 words)</span>
                  </label>
                  <input type="text" value={formTitle} onChange={(e) => { setFormTitle(e.target.value); setTitleError("") }} placeholder="e.g., Government announces new policy" className="w-full rounded-lg border-2 border-border bg-background px-4 py-3 text-base text-foreground placeholder:text-muted-foreground/50 focus:border-orange-500 focus:outline-none" required disabled={submitting} />
                  {titleError && <p className="mt-1 text-sm text-red-500">{titleError}</p>}
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-muted-foreground">Article Link <span className="text-red-500">*</span></label>
                  <input type="url" value={formLink} onChange={(e) => setFormLink(e.target.value)} placeholder="https://example.com/article" className="w-full rounded-lg border-2 border-border bg-background px-4 py-3 text-base text-foreground placeholder:text-muted-foreground/50 focus:border-orange-500 focus:outline-none" required disabled={submitting} />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-muted-foreground">Description <span className="text-muted-foreground/70">(optional)</span></label>
                  <textarea value={formDescription} onChange={(e) => setFormDescription(e.target.value)} placeholder="Brief summary of the update..." rows={3} className="w-full resize-none rounded-lg border-2 border-border bg-background px-4 py-3 text-base text-foreground placeholder:text-muted-foreground/50 focus:border-orange-500 focus:outline-none" />
                </div>
                <div className="flex gap-3">
                  <button type="button" onClick={() => { setShowAddForm(false); setFormTitle(""); setFormLink(""); setFormDescription(""); setTitleError(""); setSubmitError(""); setSubmitSuccess("") }} className="flex-1 rounded-lg border-2 border-border px-4 py-3 text-sm font-bold text-muted-foreground transition-colors hover:bg-muted active:scale-[0.98] disabled:opacity-50" disabled={submitting}>Cancel</button>
                  <button type="submit" className="flex-1 rounded-lg bg-orange-600 px-4 py-3 text-sm font-bold text-white transition-colors active:scale-[0.98] disabled:opacity-50" disabled={submitting}>{submitting ? "Submitting..." : "Submit Update"}</button>
                </div>
              </div>
            </form>
          )}

          {timeline.length > 0 ? (
            <div className="mt-4 space-y-3">
              {timeline.map((update) => {
                const name = update.submitted_by || "Community Member"
                const initials = name[0].toUpperCase()
                const colors = ["bg-orange-500", "bg-blue-500", "bg-green-500", "bg-purple-500", "bg-pink-500", "bg-red-500"]
                const colorIndex = name.charCodeAt(0) % colors.length
                
                const profileHref = update.username ? `/profile/${update.username}` : update.user_id ? `/profile/${update.user_id}` : null

                return (
                  <div key={update.id} className="relative rounded-xl border-2 border-border bg-card p-4 pl-5">
                    <div className="absolute left-0 top-0 bottom-0 w-1 rounded-l-xl bg-orange-500" />
                    <div className="flex items-start gap-3">
                      {/* Submitter Avatar */}
                      {profileHref ? (
                        <a href={profileHref} className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full ${colors[colorIndex]} text-xs font-bold text-white shadow-sm hover:opacity-80 transition-opacity`}>
                          {initials}
                        </a>
                      ) : (
                        <div className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full ${colors[colorIndex]} text-xs font-bold text-white shadow-sm`}>
                          {initials}
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        {/* Submitter Name */}
                        <div className="flex items-center gap-2 mb-1">
                          {profileHref ? (
                            <a href={profileHref} className="text-sm font-bold text-foreground hover:text-orange-600 hover:underline transition-colors">
                              {name}
                            </a>
                          ) : (
                            <p className="text-sm font-bold text-foreground">{name}</p>
                          )}
                        </div>
                        <h3 className="font-bold text-foreground leading-snug">{update.title}</h3>
                        {update.description && <p className="mt-1 text-sm text-muted-foreground line-clamp-2">{update.description}</p>}
                        <div className="mt-2 flex flex-wrap items-center gap-3">
                          <FaviconLink url={update.link} />
                          <span className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Calendar className="h-3 w-3" />{formatDate(update.created_at || "")}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="mt-4 rounded-xl border-2 border-dashed border-border bg-muted/50 p-6 text-center">
              <p className="text-sm text-muted-foreground">No updates yet. Add the first update!</p>
            </div>
          )}
        </div>
        )}
      </div>

      {isAdmin && (
        <div className="flex-shrink-0 border-t-4 border-orange-500 bg-card px-4 pb-6 pt-4">
          {isSignedIn && userId ? (
            <>
              <p className="mb-3 text-center text-xs font-bold uppercase tracking-widest text-muted-foreground">Update Status</p>
              <div className="grid grid-cols-2 gap-2">
                {(["pending", "in-progress", "fulfilled", "broken"] as PromiseStatus[]).map((s) => {
                  const c = STATUS_CONFIG[s]
                  const Icon = c.icon
                  const isActive = status === s
                  return (
                    <button key={s} onClick={() => onStatusChange(s)} className={`flex items-center gap-2 rounded-xl border-2 p-3 transition-all active:scale-[0.98] ${isActive ? `${c.bgColor} ${c.borderColor} shadow-lg` : "border-border bg-card hover:border-muted-foreground/30 hover:shadow-lg transition-shadow"}`}>
                      <Icon className={`h-5 w-5 ${isActive ? c.color : "text-muted-foreground"}`} />
                      <div className="text-left">
                        <span className={`block text-sm font-black ${isActive ? c.color : "text-foreground"}`}>{c.label}</span>
                      </div>
                    </button>
                  )
                })}
              </div>
            </>
          ) : null}
        </div>
      )}
    </div>
  )
}

function ShareModal({
  stats,
  stateConfig,
  onClose,
  promise,
  promiseStatus,
}: {
  stats: { total: number; fulfilled: number; inProgress: number; broken: number; pending: number }
  stateConfig: StateConfig
  onClose: () => void
  promise?: PromiseType
  promiseStatus?: PromiseStatus
}) {
  const generateShareText = () => {
    if (promise && promiseStatus) {
      const statusLabel = STATUS_CONFIG[promiseStatus]?.label || "Not Rated"
      return `THE MANIFESTO | ${stateConfig.name} Tracker\n\nPromise: ${promise.title}\nStatus: ${statusLabel}\n\nTrack progress:`
    }
    return `THE MANIFESTO | ${stateConfig.party} ${stateConfig.name}\n\n${stats.fulfilled} Fulfilled\n${stats.inProgress} In Progress\n${stats.broken} Broken\n${stats.pending} Not Rated\n\nTrack yourself:`
  }

  const handleShare = async (platform: "twitter" | "whatsapp" | "copy") => {
    const text = generateShareText()
    let url = ""
    if (typeof window !== "undefined") {
      const origin = window.location.origin
      const pathname = window.location.pathname
      url = promise ? `${origin}${pathname}?promise=${promise.id}` : window.location.href
    }
    if (platform === "twitter") {
      window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`, "_blank")
    } else if (platform === "whatsapp") {
      window.open(`https://wa.me/?text=${encodeURIComponent(text + " " + url)}`, "_blank")
    } else if (platform === "copy") {
      await navigator.clipboard.writeText(text + " " + url)
      alert("Copied to clipboard!")
    }
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50" onClick={onClose}>
      <div className="w-full max-w-md rounded-t-3xl bg-card p-6" onClick={(e) => e.stopPropagation()}>
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="font-serif text-xl font-black text-foreground">
              {promise ? "Share Promise" : "Share Progress"}
            </h2>
            <p className="text-sm text-muted-foreground">
              {promise ? "Spread the word on this commitment" : `Show how ${stateConfig.party} is tracking`}
            </p>
          </div>
          <button onClick={onClose} className="flex h-9 w-9 items-center justify-center rounded-full bg-muted">
            <X className="h-5 w-5 text-foreground" />
          </button>
        </div>
        
        {promise && promiseStatus ? (
          <div className="mt-4 rounded-2xl bg-foreground p-4 text-white">
            <p className="text-[10px] font-bold uppercase tracking-widest text-white/60">
              {stateConfig.name.toUpperCase()} GOVERNMENT PROMISE
            </p>
            <p className="mt-2 font-serif font-black leading-tight text-white line-clamp-2">
              {promise.title}
            </p>
            <div className="mt-3 flex items-center gap-2">
              <span className={`h-2.5 w-2.5 rounded-full ${STATUS_CONFIG[promiseStatus]?.color === "text-green-600" ? "bg-green-500" : STATUS_CONFIG[promiseStatus]?.color === "text-amber-600" ? "bg-amber-500" : STATUS_CONFIG[promiseStatus]?.color === "text-red-600" ? "bg-red-500" : "bg-white/40"}`} />
              <span className="text-sm font-bold text-white/80">
                Status: {STATUS_CONFIG[promiseStatus]?.label || "Not Rated"}
              </span>
            </div>
          </div>
        ) : (
          <div className="mt-4 rounded-2xl bg-foreground p-4 text-white">
            <p className="font-black">THE MANIFESTO</p>
            <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
              <div className="flex items-center gap-2"><span className="h-3 w-3 rounded-full bg-green-500" /><span>{stats.fulfilled} Fulfilled</span></div>
              <div className="flex items-center gap-2"><span className="h-3 w-3 rounded-full bg-amber-500" /><span>{stats.inProgress} In Progress</span></div>
              <div className="flex items-center gap-2"><span className="h-3 w-3 rounded-full bg-red-500" /><span>{stats.broken} Broken</span></div>
              <div className="flex items-center gap-2"><span className="h-3 w-3 rounded-full bg-white/40" /><span className="text-white/70">{stats.pending} Not Rated</span></div>
            </div>
          </div>
        )}

        <div className="mt-4 grid grid-cols-3 gap-3">
          <button onClick={() => handleShare("twitter")} className="flex flex-col items-center gap-2 rounded-2xl bg-[#1DA1F2] p-4 text-white transition-all active:scale-95">
            <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" /></svg>
            <span className="text-xs font-bold">Twitter</span>
          </button>
          <button onClick={() => handleShare("whatsapp")} className="flex flex-col items-center gap-2 rounded-2xl bg-[#25D366] p-4 text-white transition-all active:scale-95">
            <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" /></svg>
            <span className="text-xs font-bold">WhatsApp</span>
          </button>
          <button onClick={() => handleShare("copy")} className="flex flex-col items-center gap-2 rounded-2xl bg-foreground p-4 text-white transition-all active:scale-95">
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
            <span className="text-xs font-bold">Copy</span>
          </button>
        </div>
      </div>
    </div>
  )
}

function CategoryShareModal({
  category,
  statuses,
  overallProgress,
  stateConfig,
  onClose,
}: {
  category: Category
  statuses: Record<string, PromiseStatus>
  overallProgress: number
  stateConfig: StateConfig
  onClose: () => void
}) {
  const [downloading, setDownloading] = useState(false)

  const total = category.promises.length
  const fulfilled = category.promises.filter((p) => statuses[p.id] === "fulfilled").length
  const inProgress = category.promises.filter((p) => statuses[p.id] === "in-progress").length
  const broken = category.promises.filter((p) => statuses[p.id] === "broken").length
  const pending = total - fulfilled - inProgress - broken
  const stats = { total, fulfilled, inProgress, broken, pending }

  const shareUrl = `${typeof window !== "undefined" ? window.location.origin : "https://manifesto.page"}${typeof window !== "undefined" ? window.location.pathname : ""}?category=${category.id}`

  const generateShareText = () => {
    return `${stateConfig.name} - ${category.localName || category.name} Progress:\n\n` +
      `✅ Fulfilled: ${stats.fulfilled}\n` +
      `⏳ In Progress: ${stats.inProgress}\n` +
      `❌ Broken/Stalled: ${stats.broken}\n` +
      `⭕ Not Started: ${stats.pending}\n\n` +
      `Check details:`
  }

  const handleShare = (platform: "twitter" | "whatsapp" | "copy") => {
    const text = generateShareText()
    if (platform === "twitter") {
      window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(shareUrl)}`, "_blank")
    } else if (platform === "whatsapp") {
      window.open(`https://wa.me/?text=${encodeURIComponent(text + " " + shareUrl)}`, "_blank")
    } else if (platform === "copy") {
      navigator.clipboard.writeText(shareUrl).then(() => {
        alert("Category link copied to clipboard!")
        onClose()
      }).catch(() => {
        alert("Failed to copy link. Please copy it manually.")
      })
    }
  }

  const handleDownloadImage = () => {
    try {
      setDownloading(true)
      
      const loadImage = (src: string): Promise<HTMLImageElement> => {
        return new Promise((resolve, reject) => {
          const img = new Image()
          img.crossOrigin = "anonymous"
          img.src = src
          img.onload = () => resolve(img)
          img.onerror = (e) => reject(e)
        })
      }

      const wrapText = (
        ctx: CanvasRenderingContext2D,
        text: string,
        x: number,
        y: number,
        maxWidth: number,
        lineHeight: number
      ) => {
        const words = text.split(" ")
        let line = ""
        let currentY = y

        for (let n = 0; n < words.length; n++) {
          const testLine = line + words[n] + " "
          const metrics = ctx.measureText(testLine)
          const testWidth = metrics.width
          if (testWidth > maxWidth && n > 0) {
            ctx.fillText(line, x, currentY)
            line = words[n] + " "
            currentY += lineHeight
          } else {
            line = testLine
          }
        }
        ctx.fillText(line, x, currentY)
      }

      Promise.all([
        loadImage("/og-image.jpg").catch(() => null),
        loadImage("/manifesto-logo.png").catch(() => null)
      ]).then(([bgImg, logoImg]) => {
        const canvas = document.createElement("canvas")
        canvas.width = 1080
        canvas.height = 1080
        const ctx = canvas.getContext("2d")
        if (!ctx) throw new Error("Could not get canvas context")

        // 1. Solid base background (light grey)
        ctx.fillStyle = "#f8fafc" // slate-50
        ctx.fillRect(0, 0, 1080, 1080)

        // 2. Draw soft radial glow over the base
        const radialGrad = ctx.createRadialGradient(540, 540, 100, 540, 540, 600)
        radialGrad.addColorStop(0, "rgba(255, 255, 255, 0.45)")
        radialGrad.addColorStop(1, "rgba(241, 245, 249, 0.88)") // slate-100/88
        ctx.fillStyle = radialGrad
        ctx.fillRect(0, 0, 1080, 1080)

        // 3. Draw backdrop image if available (page screenshot overlay)
        if (bgImg) {
          const canvasSize = 1080
          const iw = bgImg.width
          const ih = bgImg.height
          const r = Math.max(canvasSize / iw, canvasSize / ih)
          const nw = iw * r
          const nh = ih * r
          const cx = (canvasSize - nw) / 2
          const cy = (canvasSize - nh) / 2
          
          ctx.save()
          ctx.globalAlpha = 0.22 // Make the web feature image clearly visible as backdrop
          if (typeof ctx.filter !== "undefined") {
            ctx.filter = "blur(3px)" // Smooth blur to avoid text-on-text clash
          }
          ctx.drawImage(bgImg, cx, cy, nw, nh)
          ctx.restore()
        }

        // Helper function for rounded rectangles with shadow and color stripes
        const drawCardWithStripe = (
          x: number,
          y: number,
          w: number,
          h: number,
          r: number,
          bgColor: string,
          borderColor: string,
          stripeColor: string
        ) => {
          ctx.save()
          
          // Card Shadow
          ctx.shadowColor = "rgba(15, 23, 42, 0.04)" // slate-900 shadow
          ctx.shadowBlur = 24
          ctx.shadowOffsetY = 8
          
          // Background fill
          ctx.fillStyle = bgColor
          ctx.strokeStyle = borderColor
          ctx.lineWidth = 1.5
          ctx.beginPath()
          if (typeof ctx.roundRect === "function") {
            ctx.roundRect(x, y, w, h, r)
          } else {
            ctx.moveTo(x + r, y)
            ctx.arcTo(x + w, y, x + w, y + h, r)
            ctx.arcTo(x + w, y + h, x, y + h, r)
            ctx.arcTo(x, y + h, x, y, r)
            ctx.arcTo(x, y, x + w, y, r)
          }
          ctx.fill()
          ctx.stroke()
          
          // Left accent stripe (clipped to card's rounded left border)
          ctx.shadowColor = "transparent"
          ctx.save()
          ctx.beginPath()
          if (typeof ctx.roundRect === "function") {
            ctx.roundRect(x, y, w, h, r)
          } else {
            ctx.moveTo(x + r, y)
            ctx.arcTo(x + w, y, x + w, y + h, r)
            ctx.arcTo(x + w, y + h, x, y + h, r)
            ctx.arcTo(x, y + h, x, y, r)
            ctx.arcTo(x, y, x + w, y, r)
          }
          ctx.clip()
          ctx.fillStyle = stripeColor
          ctx.fillRect(x, y, 8, h)
          ctx.restore()
          
          ctx.restore()
        }

        // 4. Main Glassmorphic Panel Container (Frosted card)
        const panelX = 54
        const panelY = 54
        const panelW = 972
        const panelH = 972
        const panelR = 32

        ctx.save()
        ctx.shadowColor = "rgba(15, 23, 42, 0.08)"
        ctx.shadowBlur = 40
        ctx.shadowOffsetY = 12
        ctx.fillStyle = "rgba(255, 255, 255, 0.78)" // slightly more translucent for better backdrop visibility
        ctx.strokeStyle = "rgba(226, 232, 240, 0.85)" // slate-200/85
        ctx.lineWidth = 2
        ctx.beginPath()
        if (typeof ctx.roundRect === "function") {
          ctx.roundRect(panelX, panelY, panelW, panelH, panelR)
        } else {
          ctx.moveTo(panelX + panelR, panelY)
          ctx.arcTo(panelX + panelW, panelY, panelX + panelW, panelY + panelH, panelR)
          ctx.arcTo(panelX + panelW, panelY + panelH, panelX, panelY + panelH, panelR)
          ctx.arcTo(panelX, panelY + panelH, panelX, panelY, panelR)
          ctx.arcTo(panelX, panelY, panelX + panelW, panelY, panelR)
        }
        ctx.fill()
        ctx.stroke()
        ctx.restore()

        // 5. Header Section
        // Logo / Icon image
        if (logoImg) {
          ctx.drawImage(logoImg, 94, 84, 80, 80) // Enlarged for better branding presence
        } else {
          // Fallback logo circle
          ctx.beginPath()
          ctx.fillStyle = "#ea580c"
          ctx.arc(134, 124, 40, 0, Math.PI * 2)
          ctx.fill()
          ctx.fillStyle = "#ffffff"
          ctx.font = "bold 36px sans-serif"
          ctx.textAlign = "center"
          ctx.textBaseline = "middle"
          ctx.fillText("M", 134, 124)
          ctx.textAlign = "left"
          ctx.textBaseline = "alphabetic"
        }

        // Brand Names
        ctx.fillStyle = "#0f172a" // slate-900
        ctx.font = "bold 32px sans-serif" // enlarged from 24px and fixed invalid font-weight
        ctx.fillText("THE MANIFESTO", 194, 118)

        ctx.fillStyle = "#64748b" // slate-500
        ctx.font = "bold 13px sans-serif"
        ctx.fillText("CITIZEN-POWERED ACCOUNTABILITY", 194, 146)

        // State Tracker Tag
        ctx.font = "bold 24px sans-serif" // enlarged from 18px
        ctx.fillStyle = "#0f172a"
        const stateText = `${stateConfig.name.toUpperCase()} TRACKER`
        const stateTextWidth = ctx.measureText(stateText).width
        ctx.fillText(stateText, 986 - stateTextWidth, 118)

        ctx.font = "bold 13px sans-serif"
        ctx.fillStyle = "#ea580c" // orange-600
        const partyText = `${stateConfig.party.toUpperCase()} GOVERNMENT`
        const partyTextWidth = ctx.measureText(partyText).width
        ctx.fillText(partyText, 986 - partyTextWidth, 146)

        // Divider
        ctx.strokeStyle = "rgba(226, 232, 240, 0.8)" // slate-200
        ctx.lineWidth = 1.5
        ctx.beginPath()
        ctx.moveTo(94, 185)
        ctx.lineTo(986, 185)
        ctx.stroke()

        // 6. Category Info
        ctx.fillStyle = "#ea580c" // orange-600
        ctx.font = "bold 14px sans-serif"
        ctx.fillText("CATEGORY PROGRESS REPORT", 94, 230)

        ctx.fillStyle = "#0f172a" // slate-900
        ctx.font = "900 48px sans-serif" // enlarged from 38px and fixed font-weight
        const maxTitleWidth = 892
        const categoryTitle = category.localName || category.name
        wrapText(ctx, categoryTitle, 94, 290, maxTitleWidth, 58)

        // 7. Stats Cards (2x2 Grid)
        const startX = 94
        const cardY = 385
        const cardW = 428
        const cardH = 175
        const gap = 36
        const borderRadius = 20

        // Card 1: Fulfilled (Row 1 Left)
        drawCardWithStripe(startX, cardY, cardW, cardH, borderRadius, "#f0fdf4", "#bbf7d0", "#22c55e")
        ctx.fillStyle = "#15803d" // green-700
        ctx.font = "bold 15px sans-serif"
        ctx.fillText("FULFILLED", startX + 32, cardY + 46)
        ctx.fillStyle = "#166534" // green-800
        ctx.font = "bold 64px sans-serif" // enlarged from 56px
        ctx.fillText(String(stats.fulfilled), startX + 32, cardY + 124)

        // Card 2: In Progress (Row 1 Right)
        const x2 = startX + cardW + gap
        drawCardWithStripe(x2, cardY, cardW, cardH, borderRadius, "#fffbeb", "#fef3c7", "#f59e0b")
        ctx.fillStyle = "#b45309" // amber-700
        ctx.font = "bold 15px sans-serif"
        ctx.fillText("IN PROGRESS", x2 + 32, cardY + 46)
        ctx.fillStyle = "#92400e" // amber-800
        ctx.font = "bold 64px sans-serif" // enlarged from 56px
        ctx.fillText(String(stats.inProgress), x2 + 32, cardY + 124)

        // Card 3: Broken (Row 2 Left)
        const cardY2 = cardY + cardH + gap
        drawCardWithStripe(startX, cardY2, cardW, cardH, borderRadius, "#fef2f2", "#fecaca", "#ef4444")
        ctx.fillStyle = "#b91c1c" // red-700
        ctx.font = "bold 15px sans-serif"
        ctx.fillText("BROKEN / STALLED", startX + 32, cardY2 + 46)
        ctx.fillStyle = "#991b1b" // red-800
        ctx.font = "bold 64px sans-serif" // enlarged from 56px
        ctx.fillText(String(stats.broken), startX + 32, cardY2 + 124)

        // Card 4: Not Started (Row 2 Right)
        drawCardWithStripe(x2, cardY2, cardW, cardH, borderRadius, "#f8fafc", "#e2e8f0", "#64748b")
        ctx.fillStyle = "#475569" // slate-600
        ctx.font = "bold 15px sans-serif"
        ctx.fillText("NOT STARTED", x2 + 32, cardY2 + 46)
        ctx.fillStyle = "#0f172a" // slate-900
        ctx.font = "bold 64px sans-serif" // enlarged from 56px
        ctx.fillText(String(stats.pending), x2 + 32, cardY2 + 124)

        // 8. State overall progress bar
        const progressY = 820
        ctx.fillStyle = "#334155" // slate-700
        ctx.font = "bold 15px sans-serif" // enlarged from 13px
        ctx.fillText(`STATE OVERALL PROGRESS: ${overallProgress}%`, 94, progressY + 15)

        // Track bar
        const trackW = 892
        const trackH = 14
        // Draw track card
        ctx.save()
        ctx.fillStyle = "#e2e8f0"
        ctx.strokeStyle = "rgba(0,0,0,0.02)"
        ctx.lineWidth = 1
        ctx.beginPath()
        if (typeof ctx.roundRect === "function") {
          ctx.roundRect(94, progressY + 28, trackW, trackH, 7)
        } else {
          ctx.moveTo(94 + 7, progressY + 28)
          ctx.arcTo(94 + trackW, progressY + 28, 94 + trackW, progressY + 28 + trackH, 7)
          ctx.arcTo(94 + trackW, progressY + 28 + trackH, 94, progressY + 28 + trackH, 7)
          ctx.arcTo(94, progressY + 28 + trackH, 94, progressY + 28, 7)
          ctx.arcTo(94, progressY + 28, 94 + trackW, progressY + 28, 7)
        }
        ctx.fill()
        ctx.stroke()
        ctx.restore()

        // Fill bar
        if (overallProgress > 0) {
          const fillW = Math.max(15, trackW * (overallProgress / 100))
          const fillGrad = ctx.createLinearGradient(94, 0, 94 + fillW, 0)
          fillGrad.addColorStop(0, "#ea580c") // orange-600
          fillGrad.addColorStop(1, "#f59e0b") // amber-500
          ctx.save()
          ctx.fillStyle = fillGrad
          ctx.beginPath()
          if (typeof ctx.roundRect === "function") {
            ctx.roundRect(94, progressY + 28, fillW, trackH, 7)
          } else {
            ctx.moveTo(94 + 7, progressY + 28)
            ctx.arcTo(94 + fillW, progressY + 28, 94 + fillW, progressY + 28 + trackH, 7)
            ctx.arcTo(94 + fillW, progressY + 28 + trackH, 94, progressY + 28 + trackH, 7)
            ctx.arcTo(94, progressY + 28 + trackH, 94, progressY + 28, 7)
            ctx.arcTo(94, progressY + 28, 94 + fillW, progressY + 28, 7)
          }
          ctx.fill()
          ctx.restore()
        }

        // 9. Footer
        ctx.strokeStyle = "rgba(226, 232, 240, 0.8)" // slate-200
        ctx.lineWidth = 1.5
        ctx.beginPath()
        ctx.moveTo(94, 915)
        ctx.lineTo(986, 915)
        ctx.stroke()

        ctx.fillStyle = "#64748b" // slate-500
        ctx.font = "16px sans-serif" // enlarged from 14px
        ctx.fillText("manifesto.page", 94, 952)

        const footerRight = "Powered by ObserverFile"
        const footerRightWidth = ctx.measureText(footerRight).width
        ctx.fillText(footerRight, 986 - footerRightWidth, 952)

        // Download trigger
        const dataUrl = canvas.toDataURL("image/png")
        const link = document.createElement("a")
        link.download = `${category.id}-progress-manifesto.png`
        link.href = dataUrl
        link.click()
        setDownloading(false)
      }).catch((e) => {
        console.error("Failed to load assets for canvas:", e)
        alert("Failed to load assets for generating the image.")
        setDownloading(false)
      })
    } catch (err) {
      console.error("Failed to generate image:", err)
      alert("Failed to generate image. Please try again.")
      setDownloading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm shadow-2xl" onClick={onClose}>
      <div className="w-full max-w-md rounded-3xl border-2 border-border bg-card p-6 shadow-2xl animate-in fade-in-50 zoom-in-95 duration-200" onClick={(e) => e.stopPropagation()}>
        <div className="mb-4 flex items-center justify-between">
          <h3 className="font-serif text-xl font-black text-foreground">Share Category Progress</h3>
          <button onClick={onClose} className="rounded-full p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors active:scale-90">
            <X className="h-5 w-5" />
          </button>
        </div>

        <p className="mb-4 text-sm text-muted-foreground">
          Download a beautiful progress report image for <strong className="text-foreground">{category.localName || category.name}</strong> or share the direct link.
        </p>

        {/* Quick Stats Grid Preview */}
        <div className="mb-6 grid grid-cols-4 gap-2 rounded-2xl bg-muted/40 p-3 text-center border border-border/50">
          <div className="rounded-lg bg-green-500/10 p-2 border border-green-500/20">
            <p className="text-[10px] font-bold text-green-600">Fulfilled</p>
            <p className="text-lg font-black text-green-700">{stats.fulfilled}</p>
          </div>
          <div className="rounded-lg bg-amber-500/10 p-2 border border-amber-500/20">
            <p className="text-[10px] font-bold text-amber-600">Running</p>
            <p className="text-lg font-black text-amber-700">{stats.inProgress}</p>
          </div>
          <div className="rounded-lg bg-red-500/10 p-2 border border-red-500/20">
            <p className="text-[10px] font-bold text-red-600">Broken</p>
            <p className="text-lg font-black text-red-700">{stats.broken}</p>
          </div>
          <div className="rounded-lg bg-neutral-500/10 p-2 border border-neutral-500/20">
            <p className="text-[10px] font-bold text-neutral-500">Stalled</p>
            <p className="text-lg font-black text-neutral-600">{stats.pending}</p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3">
          <button
            onClick={handleDownloadImage}
            disabled={downloading}
            className="flex w-full items-center justify-center gap-2.5 rounded-2xl bg-gradient-to-r from-orange-600 to-orange-500 py-3 text-sm font-bold text-white shadow-lg shadow-orange-500/20 hover:from-orange-700 hover:to-orange-600 transition-all active:scale-[0.98] disabled:opacity-50 cursor-pointer"
          >
            {downloading ? (
              <span className="flex items-center gap-1.5">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                Generating Image...
              </span>
            ) : (
              <>
                <Download className="h-4 w-4" />
                Download Progress Image
              </>
            )}
          </button>

          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={() => handleShare("twitter")}
              className="flex flex-col items-center justify-center gap-1.5 rounded-2xl border border-border bg-card py-3 text-xs font-bold text-foreground hover:bg-muted transition-colors active:scale-95 cursor-pointer"
            >
              <Twitter className="h-4 w-4 text-[#1DA1F2]" />
              Twitter
            </button>
            <button
              onClick={() => handleShare("whatsapp")}
              className="flex flex-col items-center justify-center gap-1.5 rounded-2xl border border-border bg-card py-3 text-xs font-bold text-foreground hover:bg-muted transition-colors active:scale-95 cursor-pointer"
            >
              <MessageSquare className="h-4 w-4 text-[#25D366]" />
              WhatsApp
            </button>
            <button
              onClick={() => handleShare("copy")}
              className="flex flex-col items-center justify-center gap-1.5 rounded-2xl border border-border bg-card py-3 text-xs font-bold text-foreground hover:bg-muted transition-colors active:scale-95 cursor-pointer"
            >
              <Share2 className="h-4 w-4 text-orange-600" />
              Copy Link
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function LatestUpdatesSlider({
  updates,
  categories,
  onSelectPromise,
}: {
  updates: Array<{ id: string; promise_id: string; title: string; link: string; submitted_by: string | null; created_at: string }>
  categories: Category[]
  onSelectPromise: (promise: PromiseType, category: Category) => void
}) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const isPausedRef = useRef(false)
  const animFrameRef = useRef<number | null>(null)

  const scrollByCards = (direction: "left" | "right") => {
    const el = scrollRef.current
    if (!el) return
    // Pause auto-scroll briefly while the user navigates manually
    isPausedRef.current = true
    const amount = Math.min(el.clientWidth * 0.8, 380)
    el.scrollBy({ left: direction === "left" ? -amount : amount, behavior: "smooth" })
    window.clearTimeout((scrollByCards as any)._t)
    ;(scrollByCards as any)._t = window.setTimeout(() => {
      isPausedRef.current = false
    }, 2500)
  }

  const resolved = updates.flatMap((update) => {
    for (const cat of categories) {
      const p = cat.promises.find((p) => p.id === update.promise_id)
      if (p) return [{ update, promise: p, category: cat }]
    }
    return []
  })

  useEffect(() => {
    const el = scrollRef.current
    if (!el || resolved.length === 0) return
    let pos = 0
    const speed = 0.3
    const maxScroll = el.scrollWidth - el.clientWidth
    function step() {
      if (!isPausedRef.current && el && maxScroll > 0) {
        pos += speed
        if (pos >= maxScroll) pos = 0
        el.scrollLeft = pos
      }
      animFrameRef.current = requestAnimationFrame(step)
    }
    animFrameRef.current = requestAnimationFrame(step)
    return () => { if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current) }
  }, [resolved.length])

  return (
    <div className="border-b-2 border-border bg-card py-4">
      <div className="mb-3 flex items-center gap-2 px-4">
        <Zap className="h-4 w-4 text-orange-500" />
        <span className="text-sm font-black text-foreground">Latest Updates</span>
        <span className="rounded-full bg-orange-100 px-2 py-0.5 text-[10px] font-bold text-orange-600">{resolved.length} new</span>
      </div>
      <div className="group/slider relative">
        {/* Left Arrow - desktop only */}
        <button
          type="button"
          aria-label="Scroll to previous updates"
          onClick={() => scrollByCards("left")}
          className="absolute left-2 top-1/2 z-10 hidden -translate-y-1/2 items-center justify-center rounded-full border border-border bg-card/90 p-2 shadow-md backdrop-blur-sm transition-all hover:bg-orange-500 hover:text-white active:scale-90 md:flex"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <div
          ref={scrollRef}
          className="flex gap-3 overflow-x-auto scroll-smooth pb-4 px-4 md:px-12"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none", WebkitOverflowScrolling: "touch" }}
          onMouseEnter={() => { isPausedRef.current = true }}
          onMouseLeave={() => { isPausedRef.current = false }}
          onTouchStart={() => { isPausedRef.current = true }}
          onPointerDown={() => { isPausedRef.current = true }}
        >
          {resolved.map(({ update, promise, category }, i) => (
            <button key={`${update.id}-${i}`} onClick={() => onSelectPromise(promise, category)} className="group relative flex w-[75vw] max-w-[350px] flex-shrink-0 flex-col justify-between rounded-2xl border hover:border-orange-300 bg-card p-4 text-left shadow-sm transition-all hover:shadow-lg active:scale-[0.98]">
              <div className="mb-3 flex items-center justify-between">
                <span className="rounded-full bg-orange-500 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wide text-white">{category.localName || category.name}</span>
                <span className="text-[10px] text-muted-foreground">{new Date(update.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}</span>
              </div>
              <p className="line-clamp-2 text-sm font-bold leading-snug text-foreground transition-colors group-hover:text-orange-600">{update.title}</p>
              <p className="mt-2 line-clamp-1 text-[11px] text-muted-foreground">Re: {promise.title}</p>
              <div className="absolute bottom-0 left-0 right-0 h-0.5 rounded-b-2xl bg-orange-500 opacity-0 transition-opacity group-hover:opacity-100" />
            </button>
          ))}
        </div>
        {/* Right Arrow - desktop only */}
        <button
          type="button"
          aria-label="Scroll to next updates"
          onClick={() => scrollByCards("right")}
          className="absolute right-2 top-1/2 z-10 hidden -translate-y-1/2 items-center justify-center rounded-full border border-border bg-card/90 p-2 shadow-md backdrop-blur-sm transition-all hover:bg-orange-500 hover:text-white active:scale-90 md:flex"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>
    </div>
  )
}

export default function PromiseTracker({ stateConfig }: { stateConfig: StateConfig }) {
  const CATEGORIES = stateConfig.categories
  const totalPromises = CATEGORIES.reduce((acc, cat) => acc + cat.promises.length, 0)

  const { isSignedIn, userId } = useAuth()
  const { user } = useUser()
  const { openSignIn, openUserProfile } = useClerk()
  const router = useRouter()
  const [statuses, setStatuses] = useState<Record<string, PromiseStatus>>({})
  const [timelines, setTimelines] = useState<Record<string, TimelineUpdate[]>>({})
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set())
  const [selectedPromise, setSelectedPromise] = useState<{ promise: PromiseType; category: Category } | null>(null)
  const [showShareModal, setShowShareModal] = useState(false)
  const [shareCategory, setShareCategory] = useState<Category | null>(null)
  const [sharingPromise, setSharingPromise] = useState<{ promise: PromiseType; status: PromiseStatus } | null>(null)
  const [headerHeight, setHeaderHeight] = useState(0)
  const headerRef = useRef<HTMLElement>(null)
  const [hydrated, setHydrated] = useState(false)
  const [daysInPower, setDaysInPower] = useState(0)
  const [isAdmin, setIsAdmin] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("all")
  const [latestUpdates, setLatestUpdates] = useState<Array<{ id: string; promise_id: string; title: string; link: string; submitted_by: string | null; created_at: string }>>([])
  const [contributors, setContributors] = useState<Array<{ name: string; user_id: string | null; username: string | null; contribution_count: number; last_contribution: string }>>([])
  const [showStateMenu, setShowStateMenu] = useState(false)
  const [showSignInBanner, setShowSignInBanner] = useState(true)
  const [showContributors, setShowContributors] = useState(false)
  const [showShortcuts, setShowShortcuts] = useState(false)
  const [myUsername, setMyUsername] = useState<string | null>(null)
  const [deepLinkCommentId, setDeepLinkCommentId] = useState<string | null>(null)
  const [showDonationModal, setShowDonationModal] = useState(false)
  const searchInputRef = useRef<HTMLInputElement>(null)
  const [availableStates, setAvailableStates] = useState<Array<{ id: string; name: string; party: string }>>([])

  useEffect(() => {
    async function fetchStates() {
      try {
        const res = await fetch("/api/states")
        if (res.ok) {
          const data = await res.json()
          setAvailableStates(data)
        }
      } catch (error) { console.error("[v0] Error fetching states:", error) }
    }
    fetchStates()
  }, [])

  useEffect(() => {
    async function fetchLatestUpdates() {
      try {
        const res = await fetch(`/api/promises/latest-updates?stateId=${stateConfig.id}`)
        if (res.ok) { const data = await res.json(); setLatestUpdates(data) }
      } catch (error) { console.error("[v0] Error fetching latest updates:", error) }
    }
    fetchLatestUpdates()
  }, [stateConfig.id])

  useEffect(() => {
    async function fetchContributors() {
      try {
        const res = await fetch(`/api/contributors?stateId=${stateConfig.id}`)
        if (res.ok) { const data = await res.json(); setContributors(data) }
      } catch (error) { console.error("[v0] Error fetching contributors:", error) }
    }
    fetchContributors()
  }, [stateConfig.id])

  useEffect(() => {
    async function checkAdminStatus() {
      if (userId) {
        try {
          const response = await fetch(`/api/auth/is-admin?userId=${userId}`)
          const data = await response.json()
          setIsAdmin(data.isAdmin)
        } catch (error) { console.error("[v0] Error checking admin status:", error); setIsAdmin(false) }
      } else { setIsAdmin(false) }
    }
    checkAdminStatus()
  }, [userId])

  useEffect(() => {
    async function initializeData() {
      const dbStatuses = await fetchStatusesFromDB(stateConfig.id)
      setStatuses(dbStatuses)
      const startDate = typeof stateConfig.startDate === "string" ? new Date(stateConfig.startDate) : stateConfig.startDate
      const today = new Date()
      const simDate = new Date(startDate.getTime() + 7 * 24 * 60 * 60 * 1000)
      const effectiveToday = today < startDate ? simDate : today
      const days = Math.floor((effectiveToday.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
      setDaysInPower(Math.max(0, days))
      setHydrated(true)
    }
    initializeData()
  }, [stateConfig.id, stateConfig.startDate])

  // Fetch viewer's own username once on sign-in so the profile button navigates directly
  useEffect(() => {
    if (!isSignedIn) { setMyUsername(null); return }
    fetch("/api/username")
      .then((r) => r.ok ? r.json() : null)
      .then((d) => d?.username && setMyUsername(d.username))
      .catch(() => {})
  }, [isSignedIn])

  // Global keyboard shortcuts
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      const tag = (e.target as HTMLElement).tagName.toLowerCase()
      const isTyping = tag === "input" || tag === "textarea" || tag === "select" || (e.target as HTMLElement).isContentEditable
      if (e.key === "Escape") {
        if (showShortcuts) { setShowShortcuts(false); return }
        if (selectedPromise) { setSelectedPromise(null); return }
        if (showShareModal) { setShowShareModal(false); return }
        if (showContributors) { setShowContributors(false); return }
        if (searchQuery) { setSearchQuery(""); searchInputRef.current?.blur(); return }
        return
      }
      if (isTyping) return
      if (e.key === "/" || e.key === "f" || e.key === "F") {
        e.preventDefault()
        searchInputRef.current?.focus()
        return
      }
      if (e.key === "?" || (e.key === "h" || e.key === "H")) {
        setShowShortcuts((v) => !v)
        return
      }
      if (e.key === "s" || e.key === "S") {
        setShowShareModal((v) => !v)
        return
      }
      if (e.key === "t" || e.key === "T") {
        const el = document.getElementById("leaderboard")
        if (el && window.innerWidth >= 1024) el.scrollIntoView({ behavior: "smooth" })
        else setShowContributors((v) => !v)
        return
      }
    }
    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [showShortcuts, selectedPromise, showShareModal, showContributors, searchQuery])

  useEffect(() => {
    if (hydrated && Object.keys(statuses).length > 0) saveStatuses(statuses)
  }, [statuses, hydrated])

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search)

      // Deep-link to a specific category
      const categoryId = params.get("category")
      if (categoryId) {
        setExpandedCategories(new Set([categoryId]))
        setCategoryFilter(categoryId)
        setTimeout(() => {
          const element = document.querySelector(`[data-category-id="${categoryId}"]`)
          if (element) element.scrollIntoView({ behavior: "smooth", block: "nearest" })
        }, 100)
      }

      // Deep-link to a specific promise (and optional comment)
      const promiseId = params.get("promise")
      const commentId = params.get("comment")
      if (promiseId) {
        // Find the promise across all categories
        for (const cat of CATEGORIES) {
          const found = cat.promises.find((p) => p.id === promiseId)
          if (found) {
            if (commentId) setDeepLinkCommentId(commentId)
            setSelectedPromise({ promise: found, category: cat })
            fetchTimelineUpdatesFromDB(found.id, stateConfig.id).then((updates) => {
              setTimelines((prev) => ({ ...prev, [found.id]: updates }))
            })
            break
          }
        }
      }
    }
  }, [])

  useEffect(() => {
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href)
      if (selectedPromise) {
        url.searchParams.set("promise", selectedPromise.promise.id)
      } else {
        if (url.searchParams.has("promise")) {
          url.searchParams.delete("promise")
          url.searchParams.delete("comment")
        }
      }
      if (url.search !== window.location.search) {
        window.history.pushState(null, "", url.pathname + url.search)
      }
    }
  }, [selectedPromise])

  useEffect(() => {
    const handlePopState = () => {
      const params = new URLSearchParams(window.location.search)
      const promiseId = params.get("promise")
      if (!promiseId && selectedPromise) {
        setSelectedPromise(null)
        setDeepLinkCommentId(null)
      } else if (promiseId && (!selectedPromise || selectedPromise.promise.id !== promiseId)) {
        for (const cat of CATEGORIES) {
          const found = cat.promises.find((p) => p.id === promiseId)
          if (found) {
            const commentId = params.get("comment")
            if (commentId) setDeepLinkCommentId(commentId)
            setSelectedPromise({ promise: found, category: cat })
            break
          }
        }
      }
    }
    window.addEventListener("popstate", handlePopState)
    return () => window.removeEventListener("popstate", handlePopState)
  }, [selectedPromise])

  useEffect(() => {
    const measureHeaderHeight = () => { if (headerRef.current) setHeaderHeight(headerRef.current.offsetHeight) }
    measureHeaderHeight()
    window.addEventListener("resize", measureHeaderHeight)
    return () => window.removeEventListener("resize", measureHeaderHeight)
  }, [])

  const allPromises = CATEGORIES.flatMap((c) => c.promises)
  const total = totalPromises
  const stats = {
    total,
    fulfilled: allPromises.filter((p) => statuses[p.id] === "fulfilled").length,
    inProgress: allPromises.filter((p) => statuses[p.id] === "in-progress").length,
    broken: allPromises.filter((p) => statuses[p.id] === "broken").length,
    pending: allPromises.filter((p) => (statuses[p.id] || "pending") === "pending").length,
  }
  const overallProgress = total > 0 ? Math.round(((stats.fulfilled * 1 + stats.inProgress * 0.5) / total) * 100) : 0

  const toggleCategory = useCallback((categoryId: string) => {
    setExpandedCategories((prev) => {
      const next = new Set(prev)
      if (next.has(categoryId)) next.delete(categoryId)
      else next.add(categoryId)
      return next
    })
  }, [])

  const handleStatusChange = useCallback(
    (promiseId: string, status: PromiseStatus) => {
      setStatuses((prev) => ({ ...prev, [promiseId]: status }))
      updateStatusInDB(promiseId, status, userId ?? null, stateConfig.id)
    },
    [userId, stateConfig.id]
  )

  const handleAddTimelineUpdate = useCallback(
    (promiseId: string, update: Omit<TimelineUpdate, "id" | "timestamp">) => {
      submitTimelineUpdateToDB(promiseId, update).then(() => {
        fetchTimelineUpdatesFromDB(promiseId, stateConfig.id).then((updates) => {
          setTimelines((prev) => ({ ...prev, [promiseId]: updates }))
        })
      })
    },
    [stateConfig.id]
  )

  // Avatar color helper
  const avatarColors = [
    "bg-amber-100 text-amber-800",
    "bg-green-100 text-green-800",
    "bg-violet-100 text-violet-800",
    "bg-red-100 text-red-800",
    "bg-sky-100 text-sky-800",
  ]

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header ref={headerRef} className="sticky top-0 z-30 bg-gradient-to-r from-orange-700 via-orange-600 to-orange-500 px-2 py-2.5 sm:px-4 sm:py-4 shadow-lg">
        <div className="flex items-center gap-1.5 sm:gap-2">
          <div className="relative flex-shrink-0">
            <button onClick={() => setShowStateMenu(!showStateMenu)} className="flex h-8 w-8 sm:h-10 sm:w-10 flex-shrink-0 items-center justify-center rounded-xl bg-white/15 text-white transition-colors hover:bg-white/30 hover:scale-105 active:scale-95" title="Select State">
              <Menu className="h-4 w-4 sm:h-5 sm:w-5" />
            </button>
            {showStateMenu && (
              <>
                <div className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm" onClick={() => setShowStateMenu(false)} />
                <div className="absolute left-0 top-full z-50 mt-2 w-72 rounded-2xl border border-border bg-card p-2 shadow-2xl">
                  <p className="mb-2 px-3 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Select State</p>
                  {availableStates.length === 0 ? (
                    <p className="px-3 py-2 text-sm text-muted-foreground">No states available</p>
                  ) : (
                    availableStates.map((state) => (
                      <Link key={state.id} href={`/${state.id}`} onClick={() => setShowStateMenu(false)} className={`flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors hover:bg-muted hover:translate-x-0.5 ${state.id === stateConfig.id ? "bg-orange-100 text-orange-700" : "text-foreground"}`}>
                        <MapPin className="h-3.5 w-3.5 flex-shrink-0" />
                        {state.name}
                        {state.id === stateConfig.id && <span className="ml-auto rounded-full bg-orange-500 px-1.5 py-0.5 text-[9px] font-bold text-white">Current</span>}
                      </Link>
                    ))
                  )}
                  <div className="mt-1 border-t border-border pt-1">
                    <Link href="/states" onClick={() => setShowStateMenu(false)} className="flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-semibold text-muted-foreground transition-colors hover:bg-muted hover:text-foreground">View All States</Link>
                  </div>
                </div>
              </>
            )}
          </div>

          <div className="flex flex-1 items-center gap-1.5 sm:gap-2 min-w-0">
            <img src="/manifesto-logo.png" alt="Manifesto Logo" className="h-7 w-7 sm:h-10 sm:w-10 flex-shrink-0" />
            <div className="min-w-0 flex-1">
              <h1 className="font-serif text-[12px] sm:text-base font-black leading-tight text-white whitespace-nowrap truncate">THE MANIFESTO</h1>
              <p className="text-[7px] sm:text-[9px] font-bold uppercase tracking-tight text-white/80 whitespace-nowrap truncate">{stateConfig.party} {stateConfig.name}</p>
            </div>
          </div>

          <div className="flex items-center gap-1 sm:gap-1.5 flex-shrink-0">
            <button onClick={() => { const el = document.getElementById("leaderboard"); if (el && window.innerWidth >= 1024) { el.scrollIntoView({ behavior: "smooth" }) } else { setShowContributors(true) } }} className="flex h-8 w-8 sm:h-10 sm:w-10 flex-shrink-0 items-center justify-center rounded-xl bg-white/15 text-white transition-colors hover:bg-white/30 hover:scale-105 active:scale-95" title="Top Contributors">
              <Trophy className="h-4 w-4 sm:h-5 sm:w-5" />
            </button>
            <button onClick={() => setShowShareModal(true)} className="flex h-8 w-8 sm:h-10 sm:w-10 flex-shrink-0 items-center justify-center rounded-xl bg-white/15 text-white transition-colors hover:bg-white/30 hover:scale-105 active:scale-95" title="Share">
              <Share2 className="h-4 w-4 sm:h-5 sm:w-5" />
            </button>
            <button onClick={() => setShowShortcuts(true)} className="hidden sm:flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-white/15 text-white font-bold text-sm transition-colors hover:bg-white/30 hover:scale-105 active:scale-95" title="Keyboard shortcuts (?)">
              ?
            </button>
            {isSignedIn && <NotificationBell />}
            {isSignedIn && user ? (
              <button onClick={() => router.push(`/profile/${myUsername ?? userId}`)} className="flex h-8 w-8 sm:h-10 sm:w-10 flex-shrink-0 items-center justify-center rounded-full bg-white shadow-md overflow-hidden transition-all hover:ring-2 hover:ring-white/60 active:scale-95" title={user.firstName || "My Profile"}>
                {user.imageUrl ? (
                  <img src={user.imageUrl} alt={user.firstName || "Account"} className="h-full w-full object-cover" />
                ) : (
                  <span className="text-[10px] sm:text-sm font-black text-orange-600">{(user.firstName?.[0] || user.emailAddresses?.[0]?.emailAddress?.[0] || "U").toUpperCase()}</span>
                )}
              </button>
            ) : (
              <button onClick={() => openSignIn()} className="flex h-8 w-8 sm:h-10 sm:w-10 flex-shrink-0 items-center justify-center rounded-full bg-white shadow-md text-orange-600 font-black transition-all hover:bg-orange-50 active:scale-95" title="Sign In">
                <LogIn className="h-4 w-4 sm:h-5 sm:w-5" />
              </button>
            )}
          </div>
        </div>

        <div className="mt-2 flex flex-wrap items-center gap-2 sm:gap-3">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-2 py-1 text-[8px] font-bold text-white sm:px-3 sm:py-1.5 sm:text-xs">
            <span className="h-1.5 w-1.5 rounded-full bg-green-400 shadow-sm sm:h-2 sm:w-2" />
            <span>{hydrated ? daysInPower : "—"} Days in Power</span>
          </div>
          <a href="https://observerfile.com" target="_blank" rel="noopener noreferrer" className="text-[7px] font-semibold uppercase tracking-wider text-white hover:text-white/80 transition-colors sm:text-[8px]">Powered by ObserverFile</a>
        </div>
      </header>

      {/* Sign In Banner */}
      {!isSignedIn && showSignInBanner && (
        <div style={{ top: `${headerHeight}px` }} className="sticky z-20 bg-black px-4 py-3 sm:py-4">
          <div className="mx-auto max-w-7xl flex items-center justify-between gap-4">
            <button onClick={() => openSignIn()} className="flex-1 font-bold text-white text-sm sm:text-base hover:text-white/80 transition-colors text-center">Sign In to Submit Updates</button>
            <button onClick={() => setShowSignInBanner(false)} className="flex-shrink-0 p-1 text-white hover:text-white/70 transition-colors" title="Close">
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>
      )}

      <div className="lg:grid lg:grid-cols-4 xl:grid-cols-[1fr_3fr_1fr] lg:gap-4 lg:w-full lg:px-4 lg:pt-6">

        {/* ── LEFT SIDEBAR: Articles — xl screens only ── */}
        <aside className="max-xl:hidden">
          <div className="sticky top-24 max-h-[calc(100vh-6rem)] overflow-y-auto pb-4 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            <NoticeCard />
            <ArticlesSection />
          </div>
        </aside>

        {/* ── MAIN COLUMN ── */}
        <div className="lg:col-span-3 xl:col-span-1 min-w-0">

          {/* Overall Progress Hero */}
          <div className="border-b border-border bg-gradient-to-b from-card to-muted/20 px-4 py-4 lg:rounded-2xl lg:border-2 lg:mb-6 sm:py-6">
            <div className="mx-auto max-w-2xl lg:max-w-none">
              <div className="flex flex-col items-center gap-4 sm:flex-row sm:gap-6">
                <div className="relative flex-shrink-0">
                  <ProgressRing percent={overallProgress} size={70} strokeWidth={6} color={overallProgress >= 50 ? "#16a34a" : "#c2410c"} />
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-lg font-black text-foreground sm:text-2xl">{overallProgress}%</span>
                    <span className="text-[9px] font-medium text-muted-foreground sm:text-[10px]">Progress</span>
                  </div>
                </div>
                <div className="grid w-full flex-1 grid-cols-2 gap-2 sm:gap-3">
                  <div className="rounded-xl bg-green-50 p-2.5 sm:p-3 hover:shadow-md transition-shadow">
                    <div className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 flex-shrink-0 text-green-600 sm:h-5 sm:w-5" /><span className="text-lg font-black text-green-700 sm:text-2xl">{stats.fulfilled}</span></div>
                    <p className="text-[10px] font-medium text-green-600 sm:text-xs">Fulfilled</p>
                  </div>
                  <div className="rounded-xl bg-amber-50 p-2.5 sm:p-3 hover:shadow-md transition-shadow">
                    <div className="flex items-center gap-2"><Clock className="h-4 w-4 flex-shrink-0 text-amber-600 sm:h-5 sm:w-5" /><span className="text-lg font-black text-amber-700 sm:text-2xl">{stats.inProgress}</span></div>
                    <p className="text-[10px] font-medium text-amber-600 sm:text-xs">In Progress</p>
                  </div>
                  <div className="rounded-xl bg-red-50 p-2.5 sm:p-3 hover:shadow-md transition-shadow">
                    <div className="flex items-center gap-2"><XCircle className="h-4 w-4 flex-shrink-0 text-red-600 sm:h-5 sm:w-5" /><span className="text-lg font-black text-red-700 sm:text-2xl">{stats.broken}</span></div>
                    <p className="text-[10px] font-medium text-red-600 sm:text-xs">Broken</p>
                  </div>
                  <div className="rounded-xl bg-neutral-100 p-2.5 sm:p-3 hover:shadow-md transition-shadow">
                    <div className="flex items-center gap-2"><Circle className="h-4 w-4 flex-shrink-0 text-neutral-500 sm:h-5 sm:w-5" /><span className="text-lg font-black text-neutral-600 sm:text-2xl">{stats.pending}</span></div>
                    <p className="text-[10px] font-medium text-neutral-500 sm:text-xs">Not Rated</p>
                  </div>
                </div>
              </div>
              <p className="mt-4 text-center text-sm font-medium text-muted-foreground">
                Tracking <span className="font-black text-foreground">{total}</span> manifesto promises
              </p>
            </div>
          </div>

          {/* Latest Updates Slider */}
          {latestUpdates.length > 0 && (
            <div className="lg:rounded-2xl lg:border-2 lg:border-border lg:overflow-hidden lg:mb-6">
              <LatestUpdatesSlider
                updates={latestUpdates}
                categories={CATEGORIES}
                onSelectPromise={(promise, category) => {
                  setSelectedPromise({ promise, category })
                  fetchTimelineUpdatesFromDB(promise.id, stateConfig.id).then((updates) => {
                    setTimelines((prev) => ({ ...prev, [promise.id]: updates }))
                  })
                }}
              />
            </div>
          )}

          {/* Category Cards */}
          <div className="px-4 pt-4 pb-4 lg:px-0 lg:pt-0">
            <div className="mb-4 flex flex-col gap-3">
              <h2 className="font-serif text-lg font-black text-foreground sm:text-xl">Categories</h2>
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-2">
                <div className="relative flex-1 min-w-0">
                  <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 flex-shrink-0 text-muted-foreground" />
                  <input ref={searchInputRef} type="text" placeholder="Search promises... (press /)" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="h-9 w-full rounded-lg border border-border bg-card pl-8 pr-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-orange-400 focus:outline-none focus:ring-1 focus:ring-orange-400 sm:rounded-xl" />
                </div>
                <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} className="h-9 w-full flex-shrink-0 rounded-lg border border-border bg-card px-3 text-sm font-medium text-foreground focus:border-orange-400 focus:outline-none focus:ring-1 focus:ring-orange-400 sm:w-auto sm:rounded-xl">
                  <option value="all">All</option>
                  {CATEGORIES.map((cat) => <option key={cat.id} value={cat.id}>{cat.localName || cat.name}</option>)}
                </select>
              </div>
            </div>

            <div className="flex flex-col gap-4">
              {CATEGORIES
                .filter((category) => (categoryFilter === "all" ? true : category.id === categoryFilter))
                .filter((category) => {
                  if (!searchQuery.trim()) return true
                  const q = searchQuery.toLowerCase()
                  return (
                    category.name.toLowerCase().includes(q) ||
                    (category.localName && category.localName.toLowerCase().includes(q)) ||
                    category.promises.some((p) => p.title.toLowerCase().includes(q))
                  )
                })
                .map((category) => (
                  <CategoryCard
                    key={category.id}
                    category={category}
                    statuses={statuses}
                    isExpanded={expandedCategories.has(category.id) || searchQuery.trim().length > 0}
                    onToggle={() => toggleCategory(category.id)}
                    onPromiseSelect={(promise, cat) => {
                      setSelectedPromise({ promise, category: cat })
                      fetchTimelineUpdatesFromDB(promise.id, stateConfig.id).then((updates) => {
                        setTimelines((prev) => ({ ...prev, [promise.id]: updates }))
                      })
                    }}
                    onShare={() => setShareCategory(category)}
                  />
                ))}
            </div>
          </div>

        </div>
        {/* ── END LEFT COLUMN ── */}

        {/* ── RIGHT COLUMN: Clean Sidebar ── */}
        <aside className="max-lg:hidden lg:col-span-1">
          <div className="sticky top-24 space-y-3 max-h-[calc(100vh-6rem)] overflow-y-auto pb-4 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">

            {/* X / Twitter */}
            <a
              href="https://x.com/ManifestoPage"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-3.5 transition-colors hover:bg-muted/50"
            >
              <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-black">
                <Twitter className="h-4 w-4 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground">Follow for updates</p>
                <p className="text-xs text-muted-foreground">@ManifestoPage</p>
              </div>
              <ExternalLink className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
            </a>

            {/* Donation Box */}
            <button
              onClick={() => setShowDonationModal(true)}
              className="w-full flex items-center gap-3 rounded-xl border-2 border-orange-500/30 bg-gradient-to-br from-orange-50 to-orange-50/50 dark:from-orange-950/30 dark:to-orange-950/20 px-4 py-3.5 transition-colors hover:border-orange-500/60 hover:bg-orange-50/80 dark:hover:bg-orange-950/40"
            >
              <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-orange-500">
                <span className="text-lg">🤝</span>
              </div>
              <div className="flex-1 min-w-0 text-left">
                <p className="text-sm font-bold text-orange-700 dark:text-orange-400">Support us</p>
                <p className="text-xs text-orange-600 dark:text-orange-500">Donation Box</p>
              </div>
            </button>

            {/* Days in power */}
            <div className="rounded-xl border border-border bg-card overflow-hidden">
              <div className="flex items-center gap-4 px-4 py-4">
                <div className="relative flex-shrink-0">
                  <svg width="64" height="64" className="-rotate-90">
                    <circle cx="32" cy="32" r="26" fill="none" stroke="currentColor" strokeWidth="4" className="text-muted/40" />
                    <circle
                      cx="32" cy="32" r="26" fill="none" stroke="#E05C2A" strokeWidth="4" strokeLinecap="round"
                      strokeDasharray={`${2 * Math.PI * 26}`}
                      strokeDashoffset={`${2 * Math.PI * 26 * (1 - Math.min(daysInPower / (5 * 365), 1))}`}
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center" style={{ transform: "rotate(90deg)" }}>
                    <span className="text-sm font-medium text-foreground leading-none">
                      {hydrated ? daysInPower.toLocaleString() : "—"}
                    </span>
                    <span className="text-[9px] text-muted-foreground mt-0.5 uppercase tracking-wide">days</span>
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">Days in power</p>
                  <p className="text-xs text-muted-foreground">{stateConfig.party} · {stateConfig.name}</p>
                </div>
              </div>
            </div>

            {/* Top Contributors */}
            {contributors.length > 0 && (
              <div id="leaderboard" className="rounded-xl border border-border bg-card overflow-hidden">
                <div className="flex items-center justify-between px-4 py-3 border-b border-border">
                  <h3 className="text-xs font-medium text-foreground tracking-wide">Top contributors</h3>
                  <Trophy className="h-3.5 w-3.5 text-muted-foreground" />
                </div>
                <ul>
                  {contributors.slice(0, 5).map((c, i) => {
                    const initials = c.name.split(" ").map((w: string) => w[0]).join("").slice(0, 2).toUpperCase()
                    const row = (
                      <>
                        <span className="text-xs text-muted-foreground w-4 text-center flex-shrink-0">{i + 1}</span>
                        <div className={`h-7 w-7 rounded-full flex items-center justify-center text-[10px] font-medium flex-shrink-0 ${avatarColors[i] ?? "bg-muted text-muted-foreground"}`}>
                          {initials}
                        </div>
                        <span className="flex-1 text-sm font-medium text-foreground truncate">{c.name}</span>
                        <span className="text-xs text-muted-foreground flex-shrink-0">
                          {c.contribution_count} update{c.contribution_count !== 1 ? "s" : ""}
                        </span>
                      </>
                    )
                    return (
                      <li key={c.name} className="border-b border-border last:border-0">
                        {c.user_id || c.username ? (
                          <Link href={`/profile/${c.username || c.user_id}`} className="flex items-center gap-3 px-4 py-2.5 hover:bg-muted/40 transition-colors">
                            {row}
                          </Link>
                        ) : (
                          <div className="flex items-center gap-3 px-4 py-2.5">{row}</div>
                        )}
                      </li>
                    )
                  })}
                </ul>
              </div>
            )}

            {/* Progress Legend */}
            <div className="rounded-xl border border-border bg-card overflow-hidden">
              <div className="px-4 py-3 border-b border-border">
                <h3 className="text-xs font-medium text-foreground tracking-wide">Progress scoring</h3>
              </div>
              {[
                { dot: "bg-green-500", label: "Fulfilled", pts: "1 pt" },
                { dot: "bg-amber-500", label: "In progress", pts: "0.5 pt" },
                { dot: "bg-red-500", label: "Broken", pts: "0 pt" },
                { dot: "bg-muted-foreground/30", label: "Not rated", pts: "0 pt" },
              ].map(({ dot, label, pts }) => (
                <div key={label} className="flex items-center gap-3 px-4 py-2.5 border-b border-border last:border-0">
                  <div className={`h-2 w-2 rounded-sm flex-shrink-0 ${dot}`} />
                  <span className="flex-1 text-sm text-foreground">{label}</span>
                  <span className="text-xs text-muted-foreground">{pts}</span>
                </div>
              ))}
              <div className="px-4 py-3 bg-muted/30">
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  Score = (fulfilled + 0.5 × in-progress) ÷ total × 100
                </p>
              </div>
            </div>

            {/* Footer links */}
            <div className="mt-4 rounded-xl border border-slate-200/60 bg-slate-50/50 p-4 dark:border-slate-800/60 dark:bg-slate-900/20">
              <div className="flex flex-col gap-3 text-center">
                <a href="https://observerfile.com" target="_blank" rel="noopener noreferrer" className="group inline-flex items-center justify-center gap-1.5 text-[11px] text-muted-foreground transition-colors hover:text-foreground">
                  <span className="font-medium">Powered by</span>
                  <span className="font-bold tracking-wide text-slate-700 dark:text-slate-300 group-hover:text-blue-600 transition-colors">ObserverFile</span>
                </a>
                <div className="mx-auto h-px w-12 bg-slate-200 dark:bg-slate-800" />
                <a href="mailto:shuvo@manifesto.page" className="group inline-flex items-center justify-center gap-1.5 text-[11px] font-medium text-slate-500 transition-colors hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-400">
                  <Mail className="h-3 w-3" />
                  Contact admin
                </a>
              </div>
            </div>

          </div>
        </aside>
        {/* ── END RIGHT COLUMN ── */}

      </div>

      {/* Mobile Footer */}
      <footer className="lg:hidden border-t border-border bg-card px-4 py-6">
        <div className="mx-auto max-w-2xl">
          <h3 className="font-serif text-lg font-black text-foreground mb-3">How to Read This Tracker</h3>
          <div className="space-y-3 mb-6">
            {[
              { icon: "✓", bg: "bg-green-500", label: "Fulfilled", desc: "Promise completed (1 point)", color: "text-green-600" },
              { icon: "◐", bg: "bg-amber-500", label: "In Progress", desc: "Work started (0.5 points)", color: "text-amber-600" },
              { icon: "✗", bg: "bg-red-500", label: "Broken", desc: "Promise not kept (0 points)", color: "text-red-600" },
              { icon: "○", bg: "bg-neutral-400", label: "Not Rated", desc: "No action taken (0 points)", color: "text-neutral-600" },
            ].map(({ icon, bg, label, desc, color }) => (
              <div key={label} className="flex items-start gap-3">
                <span className={`flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full ${bg} text-xs font-bold text-white`}>{icon}</span>
                <div className="min-w-0">
                  <p className={`text-sm font-bold ${color}`}>{label}</p>
                  <p className="text-xs text-muted-foreground">{desc}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="rounded-lg bg-muted/50 p-3 mb-6">
            <p className="text-xs text-muted-foreground"><span className="font-bold">Progress Formula:</span> (Fulfilled x 1 + In Progress x 0.5) / Total Promises x 100</p>
          </div>
          <div className="grid grid-cols-2 gap-4 rounded-lg border border-border bg-muted/30 p-4 mb-6">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Ruling Party</p>
              <p className="mt-1 text-sm font-black text-foreground">{stateConfig.party}</p>
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Contact Admin</p>
              <a href="mailto:shuvo@manifesto.page" className="mt-1 flex items-center gap-1.5 text-sm font-semibold text-blue-600 hover:text-blue-700 transition-colors">
                <Mail className="h-3.5 w-3.5" /> Email
              </a>
            </div>
          </div>
          <p className="text-center text-xs text-muted-foreground mb-4">The Manifesto - Citizen-powered accountability for {stateConfig.name}</p>
          
          {/* Articles Slider - Mobile */}
          <div className="mb-4">
            <NoticeCard />
            <p className="mb-2 text-xs font-black uppercase tracking-widest text-muted-foreground">Latest from ObserverFile</p>
            <ArticlesSection mobile />
          </div>

          {/* X / Twitter Link */}
          <a
            href="https://x.com/ManifestoPage"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 rounded-lg border border-border bg-muted/30 px-3 py-2 mb-4 transition-colors hover:bg-muted/50"
          >
            <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded bg-black">
              <Twitter className="h-3 w-3 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-foreground">Follow @ManifestoPage</p>
            </div>
            <ExternalLink className="h-3 w-3 text-muted-foreground flex-shrink-0" />
          </a>

          {/* Donation Box - Mobile */}
          <button
            onClick={() => setShowDonationModal(true)}
            className="w-full flex items-center gap-2 rounded-lg border-2 border-orange-500/30 bg-gradient-to-br from-orange-50 to-orange-50/50 dark:from-orange-950/30 dark:to-orange-950/20 px-3 py-2 mb-4 transition-colors hover:border-orange-500/60"
          >
            <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded bg-orange-500">
              <span className="text-sm">🤝</span>
            </div>
            <div className="flex-1 min-w-0 text-left">
              <p className="text-xs font-bold text-orange-700 dark:text-orange-400">Support us - Donation Box</p>
            </div>
          </button>
          
          {/* Footer links */}
          <div className="mt-8 flex flex-col items-center justify-center gap-3">
            <a href="https://observerfile.com" target="_blank" rel="noopener noreferrer" className="group inline-flex items-center justify-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-[11px] text-muted-foreground transition-all hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-900/50 dark:hover:bg-slate-800">
              <span className="font-medium">Powered by</span>
              <span className="font-bold tracking-wide text-slate-700 transition-colors group-hover:text-blue-600 dark:text-slate-300 dark:group-hover:text-blue-400">ObserverFile</span>
            </a>
            <a href="mailto:shuvo@manifesto.page" className="group inline-flex items-center justify-center gap-1.5 text-[11px] font-medium text-slate-500 transition-colors hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-400">
              <Mail className="h-3.5 w-3.5" />
              Contact admin
            </a>
          </div>
        </div>
      </footer>

      {/* Promise Detail Modal */}
      {selectedPromise && (
        <PromiseDetail
          promise={selectedPromise.promise}
          category={selectedPromise.category}
          status={statuses[selectedPromise.promise.id] || "pending"}
          timeline={timelines[selectedPromise.promise.id] || []}
          stateId={stateConfig.id}
          onStatusChange={(s) => handleStatusChange(selectedPromise.promise.id, s)}
          onAddUpdate={(update) => handleAddTimelineUpdate(selectedPromise.promise.id, update)}
          onClose={() => { setSelectedPromise(null); setDeepLinkCommentId(null) }}
          onShare={() => setSharingPromise({ promise: selectedPromise.promise, status: statuses[selectedPromise.promise.id] || "pending" })}
          isSignedIn={isSignedIn ?? false}
          userId={userId ?? null}
          isAdmin={isAdmin}
          highlightCommentId={deepLinkCommentId}
        />
      )}

      {/* Share Modal */}
      {(showShareModal || sharingPromise) && (
        <ShareModal
          stats={stats}
          stateConfig={stateConfig}
          promise={sharingPromise?.promise}
          promiseStatus={sharingPromise?.status}
          onClose={() => {
            setShowShareModal(false)
            setSharingPromise(null)
          }}
        />
      )}

      {/* Keyboard Shortcuts Modal */}
      {showShortcuts && <ShortcutsModal onClose={() => setShowShortcuts(false)} />}

      {/* Top Contributors Modal (mobile) */}
      {showContributors && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 sm:items-center" onClick={() => setShowContributors(false)}>
          <div className="w-full max-w-md rounded-t-2xl border border-border bg-card shadow-xl sm:rounded-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-border px-5 py-4">
              <div className="flex items-center gap-2">
                <Trophy className="h-4 w-4 text-orange-500" />
                <h3 className="text-base font-bold text-foreground">Top Contributors</h3>
              </div>
              <button onClick={() => setShowContributors(false)} className="text-muted-foreground hover:text-foreground transition-colors" title="Close">
                <X className="h-5 w-5" />
              </button>
            </div>
            {contributors.length === 0 ? (
              <p className="px-5 py-8 text-center text-sm text-muted-foreground">No contributors yet. Be the first to submit an update!</p>
            ) : (
              <ul className="max-h-[60vh] overflow-y-auto">
                {contributors.slice(0, 10).map((c, i) => {
                  const initials = c.name.split(" ").map((w: string) => w[0]).join("").slice(0, 2).toUpperCase()
                  const row = (
                    <>
                      <span className="w-5 flex-shrink-0 text-center text-sm font-bold text-muted-foreground">{i + 1}</span>
                      <div className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full text-xs font-bold text-white ${avatarColors[i] ?? "bg-muted text-muted-foreground"}`}>
                        {initials}
                      </div>
                      <span className="flex-1 truncate text-sm font-semibold text-foreground">{c.name}</span>
                      <span className="flex-shrink-0 text-xs font-medium text-muted-foreground">
                        {c.contribution_count} update{c.contribution_count !== 1 ? "s" : ""}
                      </span>
                    </>
                  )
                  return (
                    <li key={c.name} className="border-b border-border last:border-0">
                      {c.user_id || c.username ? (
                        <Link href={`/profile/${c.username || c.user_id}`} onClick={() => setShowContributors(false)} className="flex items-center gap-3 px-5 py-3 hover:bg-muted/40 transition-colors">
                          {row}
                        </Link>
                      ) : (
                        <div className="flex items-center gap-3 px-5 py-3">{row}</div>
                      )}
                    </li>
                  )
                })}
              </ul>
            )}
          </div>
        </div>
      )}

      {/* Category Share Modal */}
      {shareCategory && (
        <CategoryShareModal
          category={shareCategory}
          statuses={statuses}
          overallProgress={overallProgress}
          stateConfig={stateConfig}
          onClose={() => setShareCategory(null)}
        />
      )}

      {/* Donation Modal */}
      <DonationModal isOpen={showDonationModal} onClose={() => setShowDonationModal(false)} />
    </div>
  )
}
