"use client"

import { useEffect, useState } from "react"
import { useAuth, useUser } from "@clerk/nextjs"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Bell, BellOff, Check, Loader2, Mail, BookmarkCheck } from "lucide-react"

interface Settings {
  email_on_update_approved: boolean
  email_on_reply: boolean
  email_on_followed_update: boolean
}

const DEFAULT: Settings = {
  email_on_update_approved: true,
  email_on_reply: true,
  email_on_followed_update: true,
}

interface FollowedPromise {
  promise_id: string
  state_id: string
  promise_title?: string
}

export default function SettingsPage() {
  const { isSignedIn, userId } = useAuth()
  const { user } = useUser()
  const router = useRouter()

  const [settings, setSettings]   = useState<Settings>(DEFAULT)
  const [loading, setLoading]     = useState(true)
  const [saving, setSaving]       = useState(false)
  const [saved, setSaved]         = useState(false)

  const [follows, setFollows]           = useState<FollowedPromise[]>([])
  const [followsLoading, setFollowsLoading] = useState(true)
  const [unfollowing, setUnfollowing]   = useState<string | null>(null)

  useEffect(() => {
    if (isSignedIn === false) { router.replace("/"); return }
    if (!isSignedIn) return

    Promise.all([
      fetch("/api/notification-settings").then((r) => r.ok ? r.json() : DEFAULT),
      fetch("/api/follows").then((r) => r.ok ? r.json() : { follows: [] }),
    ]).then(([s, f]) => {
      setSettings({ ...DEFAULT, ...s })
      setFollows(f.follows ?? [])
    }).finally(() => {
      setLoading(false)
      setFollowsLoading(false)
    })
  }, [isSignedIn, router])

  async function saveSettings(updated: Settings) {
    setSettings(updated)
    setSaving(true)
    setSaved(false)
    try {
      await fetch("/api/notification-settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updated),
      })
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
    } finally {
      setSaving(false)
    }
  }

  function toggle(key: keyof Settings) {
    saveSettings({ ...settings, [key]: !settings[key] })
  }

  async function unfollow(promiseId: string) {
    setUnfollowing(promiseId)
    try {
      const res = await fetch(`/api/follows?promiseId=${promiseId}`, { method: "DELETE" })
      if (res.ok) setFollows((prev) => prev.filter((f) => f.promise_id !== promiseId))
    } finally {
      setUnfollowing(null)
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  const EMAIL_PREFS: { key: keyof Settings; icon: React.ElementType; label: string; description: string }[] = [
    {
      key: "email_on_update_approved",
      icon: Check,
      label: "Update approved",
      description: "Get an email when your evidence submission is approved by the team.",
    },
    {
      key: "email_on_reply",
      icon: Mail,
      label: "Comment reply",
      description: "Get an email when someone replies to your comment.",
    },
    {
      key: "email_on_followed_update",
      icon: BookmarkCheck,
      label: "Followed promise update",
      description: "Get an email when a new update is approved on a promise you follow.",
    },
  ]

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-10 border-b border-border bg-card/80 backdrop-blur-sm">
        <div className="mx-auto flex max-w-2xl items-center gap-3 px-4 py-3">
          <Link
            href={`/profile/${userId}`}
            className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-muted transition-colors hover:bg-muted/80"
          >
            <ArrowLeft className="h-5 w-5 text-foreground" />
          </Link>
          <div>
            <h1 className="text-base font-black text-foreground">Notification Settings</h1>
            <p className="text-xs text-muted-foreground">{user?.primaryEmailAddress?.emailAddress}</p>
          </div>
          {saving && <Loader2 className="ml-auto h-4 w-4 animate-spin text-muted-foreground" />}
          {saved && !saving && (
            <span className="ml-auto flex items-center gap-1 text-xs font-medium text-green-600">
              <Check className="h-3.5 w-3.5" /> Saved
            </span>
          )}
        </div>
      </div>

      <div className="mx-auto max-w-2xl space-y-8 px-4 py-8">
        {/* Email notifications section */}
        <section>
          <div className="mb-4 flex items-center gap-2">
            <Mail className="h-4 w-4 text-muted-foreground" />
            <h2 className="text-sm font-black uppercase tracking-widest text-foreground">Email Notifications</h2>
          </div>

          <div className="overflow-hidden rounded-xl border border-border bg-card">
            {EMAIL_PREFS.map((pref, i) => {
              const Icon = pref.icon
              const enabled = settings[pref.key]
              return (
                <button
                  key={pref.key}
                  onClick={() => toggle(pref.key)}
                  className={`flex w-full items-center gap-4 px-5 py-4 text-left transition-colors hover:bg-muted/40 ${i > 0 ? "border-t border-border" : ""}`}
                >
                  <div className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl ${enabled ? "bg-orange-100 dark:bg-orange-900/30" : "bg-muted"}`}>
                    <Icon className={`h-4 w-4 ${enabled ? "text-orange-600" : "text-muted-foreground"}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground">{pref.label}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground leading-snug">{pref.description}</p>
                  </div>
                  {/* Toggle pill */}
                  <div className={`relative flex-shrink-0 h-6 w-11 rounded-full transition-colors ${enabled ? "bg-orange-500" : "bg-muted-foreground/30"}`}>
                    <span className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform ${enabled ? "translate-x-5" : "translate-x-0"}`} />
                  </div>
                </button>
              )
            })}
          </div>

          <p className="mt-3 text-xs text-muted-foreground px-1">
            Changes are saved automatically. You can always manage your account email at{" "}
            <a href="https://clerk.com" className="text-orange-600 hover:underline" target="_blank" rel="noopener noreferrer">
              your account settings
            </a>.
          </p>
        </section>

        {/* Followed promises section */}
        <section>
          <div className="mb-4 flex items-center gap-2">
            <Bell className="h-4 w-4 text-muted-foreground" />
            <h2 className="text-sm font-black uppercase tracking-widest text-foreground">Followed Promises</h2>
            {follows.length > 0 && (
              <span className="ml-1 rounded-full bg-orange-500 px-2 py-0.5 text-[10px] font-black text-white">
                {follows.length}
              </span>
            )}
          </div>

          {followsLoading ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : follows.length === 0 ? (
            <div className="rounded-xl border-2 border-dashed border-border px-6 py-10 text-center">
              <Bell className="mx-auto mb-3 h-8 w-8 text-muted-foreground/40" />
              <p className="text-sm font-semibold text-muted-foreground">No followed promises yet</p>
              <p className="mt-1 text-xs text-muted-foreground">Open any promise and tap the bell icon to follow it.</p>
            </div>
          ) : (
            <div className="overflow-hidden rounded-xl border border-border bg-card">
              {follows.map((f, i) => (
                <div
                  key={f.promise_id}
                  className={`flex items-center gap-4 px-5 py-4 ${i > 0 ? "border-t border-border" : ""}`}
                >
                  <Bell className="h-4 w-4 flex-shrink-0 text-orange-500" />
                  <div className="flex-1 min-w-0">
                    <p className="truncate text-sm font-semibold text-foreground">
                      {f.promise_title ?? f.promise_id}
                    </p>
                    <p className="text-xs text-muted-foreground capitalize">{f.state_id.replace(/-/g, " ")}</p>
                  </div>
                  <button
                    onClick={() => unfollow(f.promise_id)}
                    disabled={unfollowing === f.promise_id}
                    className="flex flex-shrink-0 items-center gap-1.5 rounded-lg border border-border bg-muted px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:border-red-300 hover:bg-red-50 hover:text-red-600 disabled:opacity-50 dark:hover:bg-red-950/30 dark:hover:text-red-400"
                  >
                    {unfollowing === f.promise_id
                      ? <Loader2 className="h-3 w-3 animate-spin" />
                      : <BellOff className="h-3 w-3" />}
                    Unfollow
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
