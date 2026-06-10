"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { useAuth, useClerk, useUser } from "@clerk/nextjs"
import Link from "next/link"
import {
  Calendar, ExternalLink, ArrowLeft, FileText, MapPin,
  Flame, Clock, Settings, AtSign, Check, X, Pencil, Plus, Trash2, Globe,
} from "lucide-react"

// ─── Types ────────────────────────────────────────────────────────────────────

const PLATFORMS = ["twitter", "github", "linkedin", "instagram", "youtube", "website"] as const
type Platform = (typeof PLATFORMS)[number]

const PLATFORM_META: Record<Platform, { label: string; placeholder: string; color: string; urlPrefix: string }> = {
  twitter:   { label: "X / Twitter",  placeholder: "https://x.com/username",            color: "#000000", urlPrefix: "https://x.com/" },
  github:    { label: "GitHub",        placeholder: "https://github.com/username",        color: "#24292e", urlPrefix: "https://github.com/" },
  linkedin:  { label: "LinkedIn",      placeholder: "https://linkedin.com/in/username",   color: "#0A66C2", urlPrefix: "https://linkedin.com/in/" },
  instagram: { label: "Instagram",     placeholder: "https://instagram.com/username",     color: "#E1306C", urlPrefix: "https://instagram.com/" },
  youtube:   { label: "YouTube",       placeholder: "https://youtube.com/@channel",       color: "#FF0000", urlPrefix: "https://youtube.com/" },
  website:   { label: "Website",       placeholder: "https://yourwebsite.com",            color: "#6366f1", urlPrefix: "" },
}

// Inline SVG brand icons to avoid external deps
function PlatformIcon({ platform, size = 16 }: { platform: Platform; size?: number }) {
  const s = size
  if (platform === "twitter") return (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="currentColor">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.746l7.73-8.835L1.254 2.25H8.08l4.258 5.63L18.244 2.25zm-1.161 17.52h1.833L7.084 4.126H5.117L17.083 19.77z" />
    </svg>
  )
  if (platform === "github") return (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
    </svg>
  )
  if (platform === "linkedin") return (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="currentColor">
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
    </svg>
  )
  if (platform === "instagram") return (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
    </svg>
  )
  if (platform === "youtube") return (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="currentColor">
      <path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
    </svg>
  )
  // website / globe fallback
  return <Globe width={s} height={s} />
}

interface ProfileData {
  profile: {
    userId: string
    username: string | null
    name: string
    bio: string | null
    socialLinks: Partial<Record<Platform, string>>
    totalContributions: number
    pendingContributions: number
    activeDays: number
    statesContributed: number
    memberSince: string
    lastActive: string
  }
  contributions: {
    id: string
    title: string
    link: string
    description: string
    created_at: string
    state_id: string
    promise_id: string
    promise_title: string
    category_name: string
    category_color: string
  }[]
  activityData: { day: string; count: number }[]
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(date: string) {
  return new Date(date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })
}

function timeAgo(date: string) {
  const diff = Date.now() - new Date(date).getTime()
  const days = Math.floor(diff / 86400000)
  if (days === 0) return "Today"
  if (days === 1) return "Yesterday"
  if (days < 30) return `${days} days ago`
  if (days < 365) return `${Math.floor(days / 30)} months ago`
  return `${Math.floor(days / 365)} years ago`
}

function toLocalDateKey(date: Date) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, "0")
  const d = String(date.getDate()).padStart(2, "0")
  return `${y}-${m}-${d}`
}

function buildHeatmapGrid(activityData: { day: string; count: number }[]) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const startDate = new Date(today)
  startDate.setDate(today.getDate() - 363)
  const dayOfWeek = startDate.getDay()
  startDate.setDate(startDate.getDate() - dayOfWeek)
  const activityMap = new Map(activityData.map((d) => [String(d.day).split("T")[0], Number(d.count)]))
  const weeks: { date: Date; count: number; isPlaceholder: boolean }[][] = []
  let currentDate = new Date(startDate)
  while (currentDate <= today) {
    const week: { date: Date; count: number; isPlaceholder: boolean }[] = []
    for (let i = 0; i < 7; i++) {
      const dateStr = toLocalDateKey(currentDate)
      week.push({ date: new Date(currentDate), count: activityMap.get(dateStr) || 0, isPlaceholder: currentDate > today })
      currentDate.setDate(currentDate.getDate() + 1)
    }
    weeks.push(week)
  }
  return weeks
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function ActivityHeatmap({ activityData }: { activityData: { day: string; count: number }[] }) {
  const weeks = buildHeatmapGrid(activityData)
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]

  const getColor = (count: number, isPlaceholder: boolean) => {
    if (isPlaceholder) return "bg-muted/30"
    if (count === 0) return "bg-muted"
    if (count === 1) return "bg-orange-200 dark:bg-orange-900"
    if (count === 2) return "bg-orange-300 dark:bg-orange-700"
    if (count >= 3) return "bg-orange-500"
    return "bg-muted"
  }

  const monthLabels: { label: string; colIndex: number }[] = []
  weeks.forEach((week, i) => {
    const firstDay = week[0]
    if (!firstDay.isPlaceholder && (i === 0 || firstDay.date.getDate() <= 7)) {
      monthLabels.push({ label: months[firstDay.date.getMonth()], colIndex: i })
    }
  })

  return (
    <div className="overflow-x-auto">
      <div className="inline-flex gap-3">
        <div className="flex flex-col gap-[3px] pt-5">
          {days.map((d, i) => (
            <div key={d} className="h-[11px] text-[9px] leading-none text-muted-foreground">
              {i % 2 !== 0 ? d : ""}
            </div>
          ))}
        </div>
        <div>
          <div className="relative mb-1 flex h-4">
            {monthLabels.map(({ label, colIndex }) => (
              <span key={`${label}-${colIndex}`} className="absolute text-[10px] text-muted-foreground" style={{ left: `${colIndex * 14}px` }}>
                {label}
              </span>
            ))}
          </div>
          <div className="flex gap-[3px]">
            {weeks.map((week, wi) => (
              <div key={wi} className="flex flex-col gap-[3px]">
                {week.map((day, di) => (
                  <div
                    key={di}
                    title={day.isPlaceholder ? "" : `${day.date.toDateString()}: ${day.count} contribution${day.count !== 1 ? "s" : ""}`}
                    className={`h-[11px] w-[11px] rounded-[2px] transition-opacity hover:opacity-70 ${getColor(day.count, day.isPlaceholder)}`}
                  />
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string | number }) {
  return (
    <div className="flex flex-col gap-1 rounded-xl border-2 border-border bg-card p-4">
      <div className="flex items-center gap-2 text-muted-foreground">
        {icon}
        <span className="text-xs font-medium uppercase tracking-wide">{label}</span>
      </div>
      <p className="text-2xl font-black text-foreground">{value}</p>
    </div>
  )
}

// ─── Social links display ─────────────────────────────────────────────────────

function SocialLinks({ links }: { links: Partial<Record<Platform, string>> }) {
  const entries = PLATFORMS.filter((p) => links[p])
  if (entries.length === 0) return null
  return (
    <div className="flex flex-wrap gap-2">
      {entries.map((platform) => {
        const meta = PLATFORM_META[platform]
        return (
          <a
            key={platform}
            href={links[platform]}
            target="_blank"
            rel="noopener noreferrer"
            title={meta.label}
            className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 text-xs font-medium text-foreground transition-all hover:border-transparent hover:shadow-md hover:scale-105"
            style={{ "--hover-bg": meta.color } as React.CSSProperties}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = meta.color; (e.currentTarget as HTMLElement).style.color = "#fff" }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = ""; (e.currentTarget as HTMLElement).style.color = "" }}
          >
            <PlatformIcon platform={platform} size={13} />
            {meta.label}
          </a>
        )
      })}
    </div>
  )
}

// ─── Social links editor ──────────────────────────────────────────────────────

function SocialLinksEditor({
  initial,
  onSave,
  onCancel,
}: {
  initial: Partial<Record<Platform, string>>
  onSave: (links: Partial<Record<Platform, string>>) => Promise<void>
  onCancel: () => void
}) {
  const [links, setLinks] = useState<Partial<Record<Platform, string>>>({ ...initial })
  const [saving, setSaving] = useState(false)

  async function handleSave() {
    setSaving(true)
    await onSave(links)
    setSaving(false)
  }

  return (
    <div className="space-y-2">
      {PLATFORMS.map((platform) => {
        const meta = PLATFORM_META[platform]
        return (
          <div key={platform} className="flex items-center gap-2">
            <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg" style={{ backgroundColor: meta.color, color: "#fff" }}>
              <PlatformIcon platform={platform} size={13} />
            </div>
            <input
              type="url"
              value={links[platform] ?? ""}
              onChange={(e) => setLinks((prev) => ({ ...prev, [platform]: e.target.value }))}
              placeholder={meta.placeholder}
              className="flex-1 rounded-lg border border-border bg-background px-3 py-1.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-orange-400 focus:outline-none focus:ring-1 focus:ring-orange-400"
            />
            {links[platform] && (
              <button onClick={() => setLinks((prev) => { const c = { ...prev }; delete c[platform]; return c })} className="text-muted-foreground hover:text-destructive transition-colors">
                <Trash2 className="h-4 w-4" />
              </button>
            )}
          </div>
        )
      })}
      <div className="flex gap-2 pt-1">
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-1.5 rounded-lg bg-orange-500 px-4 py-1.5 text-xs font-bold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          <Check className="h-3.5 w-3.5" />
          {saving ? "Saving..." : "Save links"}
        </button>
        <button onClick={onCancel} className="rounded-lg border border-border px-4 py-1.5 text-xs font-medium text-muted-foreground hover:bg-muted transition-colors">
          Cancel
        </button>
      </div>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ProfilePage() {
  const params = useParams()
  const router = useRouter()
  const identifier = params.userId as string
  const { userId: viewerId } = useAuth()
  const { openUserProfile } = useClerk()
  const { user: clerkUser } = useUser()
  const [data, setData] = useState<ProfileData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  // Username editing
  const [editingUsername, setEditingUsername] = useState(false)
  const [usernameInput, setUsernameInput] = useState("")
  const [usernameError, setUsernameError] = useState("")
  const [savingUsername, setSavingUsername] = useState(false)

  // Bio editing
  const [editingBio, setEditingBio] = useState(false)
  const [bioInput, setBioInput] = useState("")
  const [savingBio, setSavingBio] = useState(false)

  // Social links editing
  const [editingSocial, setEditingSocial] = useState(false)

  useEffect(() => {
    if (!identifier) return
    fetch(`/api/profile/${identifier}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.error) setError(d.error)
        else {
          setData(d)
          if (d.profile?.username && identifier !== d.profile.username) {
            router.replace(`/profile/${d.profile.username}`)
          }
        }
      })
      .catch(() => setError("Failed to load profile"))
      .finally(() => setLoading(false))
  }, [identifier, router])

  const isOwnProfile = !!viewerId && !!data && viewerId === data.profile.userId

  async function saveUsername() {
    const value = usernameInput.toLowerCase().trim()
    setUsernameError("")
    setSavingUsername(true)
    try {
      const res = await fetch("/api/username", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: value }),
      })
      const json = await res.json()
      if (!res.ok) { setUsernameError(json.error || "Could not update username"); return }
      setEditingUsername(false)
      setData((prev) => (prev ? { ...prev, profile: { ...prev.profile, username: json.username } } : prev))
      router.replace(`/profile/${json.username}`)
    } catch {
      setUsernameError("Something went wrong. Try again.")
    } finally {
      setSavingUsername(false)
    }
  }

  async function saveBio() {
    setSavingBio(true)
    try {
      await fetch("/api/profile/social", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bio: bioInput, socialLinks: data?.profile.socialLinks ?? {} }),
      })
      setData((prev) => (prev ? { ...prev, profile: { ...prev.profile, bio: bioInput } } : prev))
      setEditingBio(false)
    } finally {
      setSavingBio(false)
    }
  }

  async function saveSocialLinks(links: Partial<Record<Platform, string>>) {
    await fetch("/api/profile/social", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ bio: data?.profile.bio ?? "", socialLinks: links }),
    })
    setData((prev) => (prev ? { ...prev, profile: { ...prev.profile, socialLinks: links } } : prev))
    setEditingSocial(false)
  }

  const AVATAR_COLORS = ["bg-orange-500", "bg-blue-500", "bg-green-500", "bg-purple-500", "bg-pink-500", "bg-red-500"]

  if (loading) return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-3">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-orange-500 border-t-transparent" />
        <p className="text-sm text-muted-foreground">Loading profile...</p>
      </div>
    </div>
  )

  if (error || !data) return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background">
      <p className="text-lg font-bold text-foreground">Profile not found</p>
      <Link href="/" className="flex items-center gap-2 text-sm text-orange-600 hover:underline">
        <ArrowLeft className="h-4 w-4" /> Back to tracker
      </Link>
    </div>
  )

  const { profile, contributions, activityData } = data
  const initials = profile.name?.[0]?.toUpperCase() ?? "?"
  const colorClass = AVATAR_COLORS[profile.name?.charCodeAt(0) % AVATAR_COLORS.length] ?? "bg-orange-500"
  const hasSocialLinks = PLATFORMS.some((p) => profile.socialLinks?.[p])

  return (
    <main className="min-h-screen bg-background font-sans">
      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-border bg-card/95 backdrop-blur-sm">
        <div className="mx-auto flex max-w-4xl items-center gap-3 px-4 py-3">
          <Link href="/" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="h-4 w-4" />
            <span className="hidden sm:inline">Back to Tracker</span>
          </Link>
          <span className="text-muted-foreground">/</span>
          <span className="text-sm font-bold text-foreground truncate">{profile.name}</span>
        </div>
      </header>

      <div className="mx-auto max-w-4xl px-4 py-8 sm:py-12">

        {/* ── Hero card ── */}
        <div className="mb-8 rounded-2xl border-2 border-border bg-card p-6">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
            {/* Avatar */}
            {isOwnProfile && clerkUser?.imageUrl ? (
              <img
                src={clerkUser.imageUrl}
                alt={profile.name}
                className="h-24 w-24 flex-shrink-0 rounded-2xl object-cover shadow-lg ring-2 ring-border"
              />
            ) : (
              <div className={`flex h-24 w-24 flex-shrink-0 items-center justify-center rounded-2xl ${colorClass} text-4xl font-black text-white shadow-lg`}>
                {initials}
              </div>
            )}

            {/* Name / handle / bio / badges */}
            <div className="flex-1 min-w-0">
              <h1 className="font-serif text-3xl font-bold text-foreground sm:text-4xl text-balance">{profile.name}</h1>

              {/* Username */}
              {editingUsername ? (
                <div className="mt-2">
                  <div className="flex items-center gap-2">
                    <div className="flex items-center rounded-lg border-2 border-border bg-background px-2 py-1 focus-within:border-orange-500">
                      <AtSign className="h-3.5 w-3.5 text-muted-foreground" />
                      <input
                        autoFocus
                        value={usernameInput}
                        onChange={(e) => setUsernameInput(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))}
                        onKeyDown={(e) => { if (e.key === "Enter") saveUsername(); if (e.key === "Escape") setEditingUsername(false) }}
                        maxLength={40}
                        placeholder="username"
                        className="w-40 bg-transparent px-1 text-sm font-medium text-foreground outline-none"
                      />
                    </div>
                    <button onClick={saveUsername} disabled={savingUsername} className="flex h-7 w-7 items-center justify-center rounded-lg bg-orange-500 text-white hover:opacity-90 disabled:opacity-50" title="Save">
                      <Check className="h-4 w-4" />
                    </button>
                    <button onClick={() => { setEditingUsername(false); setUsernameError("") }} className="flex h-7 w-7 items-center justify-center rounded-lg border-2 border-border text-muted-foreground hover:bg-muted" title="Cancel">
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                  {usernameError && <p className="mt-1 text-xs font-medium text-red-600">{usernameError}</p>}
                </div>
              ) : (
                <div className="mt-1 flex items-center gap-2">
                  {profile.username && (
                    <span className="inline-flex items-center text-sm font-semibold text-orange-600">
                      <AtSign className="h-3.5 w-3.5" />{profile.username}
                    </span>
                  )}
                  {isOwnProfile && (
                    <button onClick={() => { setUsernameInput(profile.username || ""); setEditingUsername(true) }} className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors" title="Edit username">
                      <Pencil className="h-3 w-3" /> Edit
                    </button>
                  )}
                </div>
              )}

              <p className="mt-1 text-xs text-muted-foreground">
                Citizen contributor &middot; Member since {formatDate(profile.memberSince)}
              </p>

              {/* Bio */}
              <div className="mt-3">
                {editingBio ? (
                  <div className="space-y-2">
                    <textarea
                      autoFocus
                      value={bioInput}
                      onChange={(e) => setBioInput(e.target.value.slice(0, 300))}
                      rows={3}
                      placeholder="Write a short bio..."
                      className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-orange-400 focus:outline-none focus:ring-1 focus:ring-orange-400 resize-none"
                    />
                    <div className="flex items-center gap-2">
                      <button onClick={saveBio} disabled={savingBio} className="flex items-center gap-1.5 rounded-lg bg-orange-500 px-3 py-1.5 text-xs font-bold text-white hover:opacity-90 disabled:opacity-50">
                        <Check className="h-3.5 w-3.5" />{savingBio ? "Saving..." : "Save bio"}
                      </button>
                      <button onClick={() => setEditingBio(false)} className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-muted transition-colors">
                        Cancel
                      </button>
                      <span className="ml-auto text-[11px] text-muted-foreground">{bioInput.length}/300</span>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start gap-2">
                    {profile.bio ? (
                      <p className="text-sm leading-relaxed text-muted-foreground flex-1">{profile.bio}</p>
                    ) : isOwnProfile ? (
                      <span className="text-sm text-muted-foreground/60 italic flex-1">No bio yet.</span>
                    ) : null}
                    {isOwnProfile && (
                      <button
                        onClick={() => { setBioInput(profile.bio ?? ""); setEditingBio(true) }}
                        className="flex-shrink-0 inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                      >
                        {profile.bio ? <Pencil className="h-3 w-3" /> : <Plus className="h-3 w-3" />}
                        {profile.bio ? "Edit" : "Add bio"}
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* Badges row */}
              <div className="mt-4 flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-orange-100 px-3 py-1 text-xs font-bold text-orange-700 dark:bg-orange-900/30 dark:text-orange-400">
                  <Flame className="h-3 w-3" />
                  {profile.totalContributions} contributions
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-muted px-3 py-1 text-xs font-medium text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  Last active {timeAgo(profile.lastActive)}
                </span>
                {isOwnProfile && (
                  <button
                    onClick={() => openUserProfile()}
                    className="inline-flex items-center gap-1.5 rounded-full bg-foreground px-3 py-1 text-xs font-bold text-background hover:opacity-90 transition-opacity"
                  >
                    <Settings className="h-3 w-3" /> Manage Account
                  </button>
                )}
              </div>

              {/* Social links */}
              <div className="mt-4">
                {editingSocial ? (
                  <SocialLinksEditor
                    initial={profile.socialLinks ?? {}}
                    onSave={saveSocialLinks}
                    onCancel={() => setEditingSocial(false)}
                  />
                ) : (
                  <div className="flex flex-wrap items-center gap-2">
                    <SocialLinks links={profile.socialLinks ?? {}} />
                    {isOwnProfile && (
                      <button
                        onClick={() => setEditingSocial(true)}
                        className="inline-flex items-center gap-1 rounded-full border border-dashed border-border px-3 py-1.5 text-xs text-muted-foreground hover:border-orange-400 hover:text-orange-600 transition-colors"
                      >
                        {hasSocialLinks ? <Pencil className="h-3 w-3" /> : <Plus className="h-3 w-3" />}
                        {hasSocialLinks ? "Edit links" : "Add social links"}
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Stats row */}
        <div className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatCard icon={<FileText className="h-4 w-4" />} label="Contributions" value={profile.totalContributions} />
          <StatCard icon={<Calendar className="h-4 w-4" />} label="Active Days" value={profile.activeDays} />
          <StatCard icon={<MapPin className="h-4 w-4" />} label="States" value={profile.statesContributed} />
          <StatCard icon={<Clock className="h-4 w-4" />} label="Pending" value={profile.pendingContributions} />
        </div>

        {/* Activity heatmap */}
        <div className="mb-8 rounded-2xl border-2 border-border bg-card p-5">
          <h2 className="mb-4 text-sm font-black uppercase tracking-wide text-foreground">Activity</h2>
          <ActivityHeatmap activityData={activityData} />
          <p className="mt-3 text-xs text-muted-foreground">
            {profile.totalContributions} contributions in the last year
          </p>
        </div>

        {/* Recent contributions */}
        <div>
          <h2 className="mb-4 text-sm font-black uppercase tracking-wide text-foreground">Recent Contributions</h2>
          {contributions.length === 0 ? (
            <div className="rounded-2xl border-2 border-dashed border-border p-10 text-center">
              <p className="text-sm text-muted-foreground">No approved contributions yet.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {contributions.map((c) => (
                <div key={c.id} className="relative rounded-xl border-2 border-border bg-card p-4 pl-5 transition-shadow hover:shadow-md">
                  <div className="absolute bottom-0 left-0 top-0 w-1 rounded-l-xl bg-orange-500" />
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      {c.category_name && (
                        <span className="mb-1.5 inline-block rounded-full bg-orange-500 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wide text-white">
                          {c.category_name}
                        </span>
                      )}
                      <p className="font-bold leading-snug text-foreground">{c.title}</p>
                      {c.promise_title && (
                        <p className="mt-1 line-clamp-1 text-xs text-muted-foreground">Re: {c.promise_title}</p>
                      )}
                      <div className="mt-2 flex flex-wrap items-center gap-3">
                        <a href={c.link} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-sm font-medium text-orange-600 hover:underline">
                          <ExternalLink className="h-3.5 w-3.5" /> Read Article
                        </a>
                        <span className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Calendar className="h-3 w-3" /> {formatDate(c.created_at)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  )
}
