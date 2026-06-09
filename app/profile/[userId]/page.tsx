"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { useAuth, useClerk } from "@clerk/nextjs"
import Link from "next/link"
import { Calendar, ExternalLink, ArrowLeft, FileText, MapPin, Flame, Clock, Settings } from "lucide-react"

interface ProfileData {
  profile: {
    userId: string
    name: string
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
  activityData: {
    day: string
    count: number
  }[]
}

function formatDate(date: string) {
  return new Date(date).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  })
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

// Format a Date as YYYY-MM-DD using local time (avoids UTC timezone shifts)
function toLocalDateKey(date: Date) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, "0")
  const d = String(date.getDate()).padStart(2, "0")
  return `${y}-${m}-${d}`
}

// Build a 52-week grid with correct day offsets
function buildHeatmapGrid(activityData: { day: string; count: number }[]) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  // Start from 364 days ago, aligned to Sunday
  const startDate = new Date(today)
  startDate.setDate(today.getDate() - 363)
  const dayOfWeek = startDate.getDay()
  startDate.setDate(startDate.getDate() - dayOfWeek)

  // Normalize the day key (handles both "2026-05-17" and full ISO strings)
  // and coerce count to a number (neon returns COUNT(*) as a string).
  const activityMap = new Map(
    activityData.map((d) => [String(d.day).split("T")[0], Number(d.count)]),
  )

  const weeks: { date: Date; count: number; isPlaceholder: boolean }[][] = []
  let currentDate = new Date(startDate)

  while (currentDate <= today) {
    const week: { date: Date; count: number; isPlaceholder: boolean }[] = []
    for (let i = 0; i < 7; i++) {
      const dateStr = toLocalDateKey(currentDate)
      const isFuture = currentDate > today
      week.push({
        date: new Date(currentDate),
        count: activityMap.get(dateStr) || 0,
        isPlaceholder: isFuture,
      })
      currentDate.setDate(currentDate.getDate() + 1)
    }
    weeks.push(week)
  }

  return weeks
}

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

  // Build month labels
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
        {/* Day labels */}
        <div className="flex flex-col gap-[3px] pt-5">
          {days.map((d, i) => (
            <div key={d} className="h-[11px] text-[9px] leading-none text-muted-foreground">
              {i % 2 !== 0 ? d : ""}
            </div>
          ))}
        </div>
        {/* Grid */}
        <div>
          {/* Month labels */}
          <div className="relative mb-1 flex h-4">
            {monthLabels.map(({ label, colIndex }) => (
              <span
                key={`${label}-${colIndex}`}
                className="absolute text-[10px] text-muted-foreground"
                style={{ left: `${colIndex * 14}px` }}
              >
                {label}
              </span>
            ))}
          </div>
          {/* Cells */}
          <div className="flex gap-[3px]">
            {weeks.map((week, wi) => (
              <div key={wi} className="flex flex-col gap-[3px]">
                {week.map((day, di) => (
                  <div
                    key={di}
                    title={
                      day.isPlaceholder
                        ? ""
                        : `${day.date.toDateString()}: ${day.count} contribution${day.count !== 1 ? "s" : ""}`
                    }
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

function StatCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode
  label: string
  value: string | number
}) {
  return (
    <div className="flex flex-col gap-1 rounded-xl border-2 border-border bg-card p-4">
      <div className="flex items-center gap-2 text-muted-foreground">{icon}<span className="text-xs font-medium uppercase tracking-wide">{label}</span></div>
      <p className="text-2xl font-black text-foreground">{value}</p>
    </div>
  )
}

export default function ProfilePage() {
  const params = useParams()
  const userId = params.userId as string
  const { userId: viewerId } = useAuth()
  const { openUserProfile } = useClerk()
  const isOwnProfile = viewerId === userId
  const [data, setData] = useState<ProfileData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    if (!userId) return
    fetch(`/api/profile/${userId}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.error) setError(d.error)
        else setData(d)
      })
      .catch(() => setError("Failed to load profile"))
      .finally(() => setLoading(false))
  }, [userId])

  const avatarColors = [
    "bg-orange-500", "bg-blue-500", "bg-green-500",
    "bg-purple-500", "bg-pink-500", "bg-red-500",
  ]

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-orange-500 border-t-transparent" />
          <p className="text-sm text-muted-foreground">Loading profile...</p>
        </div>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background">
        <p className="text-lg font-bold text-foreground">Profile not found</p>
        <Link href="/" className="flex items-center gap-2 text-sm text-orange-600 hover:underline">
          <ArrowLeft className="h-4 w-4" /> Back to tracker
        </Link>
      </div>
    )
  }

  const { profile, contributions, activityData } = data
  const initials = profile.name?.[0]?.toUpperCase() ?? "?"
  const colorClass = avatarColors[profile.name?.charCodeAt(0) % avatarColors.length] ?? "bg-orange-500"

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
        {/* Hero */}
        <div className="mb-8 flex flex-col items-start gap-6 sm:flex-row sm:items-center">
          <div className={`flex h-20 w-20 flex-shrink-0 items-center justify-center rounded-2xl ${colorClass} text-3xl font-black text-white shadow-lg`}>
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="font-serif text-3xl font-bold text-foreground sm:text-4xl text-balance">{profile.name}</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Citizen contributor &middot; Member since {formatDate(profile.memberSince)}
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-2">
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
                  className="inline-flex items-center gap-1.5 rounded-full bg-foreground px-3 py-1 text-xs font-bold text-background transition-opacity hover:opacity-90"
                >
                  <Settings className="h-3 w-3" />
                  Manage Account
                </button>
              )}
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
                        <p className="mt-1 line-clamp-1 text-xs text-muted-foreground">
                          Re: {c.promise_title}
                        </p>
                      )}
                      <div className="mt-2 flex flex-wrap items-center gap-3">
                        <a
                          href={c.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-sm font-medium text-orange-600 hover:underline"
                        >
                          <ExternalLink className="h-3.5 w-3.5" />
                          Read Article
                        </a>
                        <span className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Calendar className="h-3 w-3" />
                          {formatDate(c.created_at)}
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
