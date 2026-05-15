"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@clerk/nextjs"
import { Check, X, ExternalLink, Clock, ShieldX, Pencil, Save, XCircle } from "lucide-react"

interface PendingUpdate {
  id: string
  promise_id: string
  title: string
  link: string
  description?: string
  submitted_by?: string
  user_email?: string
  created_at: string
  status: string
}

interface EditState {
  title: string
  link: string
  description: string
}

export default function AdminDashboard() {
  const { isSignedIn, isLoaded, userId } = useAuth()
  const [updates, setUpdates] = useState<PendingUpdate[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [accessDenied, setAccessDenied] = useState(false)
  const [processing, setProcessing] = useState<Record<string, boolean>>({})
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editState, setEditState] = useState<EditState>({ title: "", link: "", description: "" })
  const [saving, setSaving] = useState(false)
  const [activeTab, setActiveTab] = useState<"pending" | "approved">("pending")

  useEffect(() => {
    if (isLoaded && userId) {
      fetchUpdates(activeTab)
    } else if (isLoaded && !userId) {
      setLoading(false)
    }
  }, [isLoaded, userId, activeTab])

  const fetchUpdates = async (status: "pending" | "approved") => {
    try {
      setLoading(true)
      setAccessDenied(false)
      const response = await fetch(`/api/admin/pending-updates?userId=${userId}&status=${status}`)

      if (response.status === 403) {
        setAccessDenied(true)
        return
      }

      if (!response.ok) throw new Error("Failed to fetch updates")
      const data = await response.json()
      setUpdates(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch updates")
    } finally {
      setLoading(false)
    }
  }

  const handleApprove = async (id: string) => {
    try {
      setProcessing((prev) => ({ ...prev, [id]: true }))
      const response = await fetch("/api/admin/pending-updates", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ updateId: id, action: "approve", userId }),
      })
      if (!response.ok) throw new Error("Failed to approve")
      setUpdates((prev) => prev.filter((u) => u.id !== id))
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to approve")
    } finally {
      setProcessing((prev) => ({ ...prev, [id]: false }))
    }
  }

  const handleReject = async (id: string) => {
    try {
      setProcessing((prev) => ({ ...prev, [id]: true }))
      const response = await fetch("/api/admin/pending-updates", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ updateId: id, action: "reject", userId }),
      })
      if (!response.ok) throw new Error("Failed to reject")
      setUpdates((prev) => prev.filter((u) => u.id !== id))
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to reject")
    } finally {
      setProcessing((prev) => ({ ...prev, [id]: false }))
    }
  }

  const startEditing = (update: PendingUpdate) => {
    setEditingId(update.id)
    setEditState({
      title: update.title,
      link: update.link,
      description: update.description || "",
    })
  }

  const cancelEditing = () => {
    setEditingId(null)
    setEditState({ title: "", link: "", description: "" })
  }

  const handleSaveEdit = async (id: string) => {
    if (!editState.title.trim() || !editState.link.trim()) return
    try {
      setSaving(true)
      const response = await fetch("/api/admin/pending-updates", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          updateId: id,
          title: editState.title.trim(),
          link: editState.link.trim(),
          description: editState.description.trim(),
          userId,
        }),
      })
      if (!response.ok) throw new Error("Failed to save")
      setUpdates((prev) =>
        prev.map((u) =>
          u.id === id
            ? { ...u, title: editState.title.trim(), link: editState.link.trim(), description: editState.description.trim() }
            : u
        )
      )
      setEditingId(null)
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to save")
    } finally {
      setSaving(false)
    }
  }

  const formatDate = (timestamp: string) => {
    return new Date(timestamp).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="mx-auto max-w-4xl">
        <h1 className="font-serif text-4xl font-black text-foreground">Admin Dashboard</h1>
        <p className="mt-2 text-muted-foreground">Review, edit, and moderate timeline submissions</p>

        {!isLoaded || loading ? (
          <div className="mt-6 text-center text-muted-foreground">Loading...</div>
        ) : accessDenied || !isSignedIn ? (
          <div className="mt-10 rounded-xl border-2 border-red-200 bg-red-50 p-8 text-center">
            <ShieldX className="mx-auto h-12 w-12 text-red-500" />
            <h2 className="mt-4 text-xl font-black text-red-700">Access Denied</h2>
            <p className="mt-2 text-red-600">
              {!isSignedIn
                ? "You must be signed in to access this page."
                : "You do not have admin privileges to access this dashboard."}
            </p>
            <a
              href="/"
              className="mt-6 inline-block rounded-lg bg-red-600 px-6 py-2.5 text-sm font-bold text-white transition-colors hover:bg-red-700"
            >
              Go Back Home
            </a>
          </div>
        ) : error ? (
          <div className="mt-6 rounded-lg bg-red-50 p-4 text-red-700">{error}</div>
        ) : (
          <>
            {/* Tabs */}
            <div className="mt-6 flex gap-2 border-b border-border">
              <button
                onClick={() => setActiveTab("pending")}
                className={`px-4 py-2 font-semibold transition-colors ${
                  activeTab === "pending"
                    ? "border-b-2 border-orange-500 text-orange-600"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Pending ({updates.filter((u) => u.status === "pending").length})
              </button>
              <button
                onClick={() => setActiveTab("approved")}
                className={`px-4 py-2 font-semibold transition-colors ${
                  activeTab === "approved"
                    ? "border-b-2 border-orange-500 text-orange-600"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Approved ({updates.filter((u) => u.status === "approved").length})
              </button>
            </div>

            {/* Content */}
            {updates.length === 0 ? (
          <div className="mt-6 rounded-lg border-2 border-dashed border-border bg-muted/50 p-8 text-center">
            <Clock className="mx-auto h-8 w-8 text-muted-foreground/50" />
            <p className="mt-2 text-muted-foreground">No {activeTab} submissions</p>
          </div>
            ) : (
          <div className="mt-6 space-y-4">
            <p className="text-sm font-medium text-muted-foreground">
              {updates.length} {activeTab} submission{updates.length !== 1 ? "s" : ""}
            </p>

            {updates.map((update) => {
              const isEditing = editingId === update.id
              return (
                <div key={update.id} className="rounded-xl border-2 border-border bg-card p-6">
                  {/* Header row */}
                  <div className="mb-4 flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      {isEditing ? (
                        <input
                          type="text"
                          value={editState.title}
                          onChange={(e) => setEditState((s) => ({ ...s, title: e.target.value }))}
                          className="w-full rounded-lg border border-border bg-background px-3 py-2 text-base font-black text-foreground focus:border-orange-400 focus:outline-none focus:ring-1 focus:ring-orange-400"
                          placeholder="Title"
                        />
                      ) : (
                        <h3 className="text-lg font-black text-foreground">{update.title}</h3>
                      )}
                      <p className="mt-1 text-xs text-muted-foreground font-mono">
                        {update.promise_id}
                      </p>
                    </div>

                    {/* Edit / Cancel edit button */}
                    {!isEditing ? (
                      <button
                        onClick={() => startEditing(update)}
                        className="flex flex-shrink-0 items-center gap-1.5 rounded-lg border border-border bg-muted/50 px-3 py-1.5 text-xs font-bold text-muted-foreground transition-colors hover:border-orange-400 hover:text-orange-600"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                        Edit
                      </button>
                    ) : (
                      <button
                        onClick={cancelEditing}
                        className="flex flex-shrink-0 items-center gap-1.5 rounded-lg border border-border bg-muted/50 px-3 py-1.5 text-xs font-bold text-muted-foreground transition-colors hover:border-red-400 hover:text-red-600"
                      >
                        <XCircle className="h-3.5 w-3.5" />
                        Cancel
                      </button>
                    )}
                  </div>

                  {/* Description */}
                  <div className="mb-4">
                    {isEditing ? (
                      <textarea
                        value={editState.description}
                        onChange={(e) => setEditState((s) => ({ ...s, description: e.target.value }))}
                        rows={3}
                        className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-orange-400 focus:outline-none focus:ring-1 focus:ring-orange-400"
                        placeholder="Description (optional)"
                      />
                    ) : (
                      update.description && (
                        <p className="text-sm text-muted-foreground">{update.description}</p>
                      )
                    )}
                  </div>

                  {/* Link */}
                  <div className="mb-4">
                    {isEditing ? (
                      <input
                        type="url"
                        value={editState.link}
                        onChange={(e) => setEditState((s) => ({ ...s, link: e.target.value }))}
                        className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-orange-400 focus:outline-none focus:ring-1 focus:ring-orange-400"
                        placeholder="Article URL"
                      />
                    ) : (
                      <div className="flex flex-wrap items-center gap-4">
                        <a
                          href={update.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 text-sm text-orange-600 hover:underline"
                        >
                          <ExternalLink className="h-4 w-4" />
                          View Article
                        </a>
                        <span className="text-xs text-muted-foreground">{formatDate(update.created_at)}</span>
                      </div>
                    )}
                  </div>

                  {/* Submitter info */}
                  <div className="mb-4 rounded-lg bg-muted/30 p-3">
                    <p className="text-xs font-medium text-muted-foreground">
                      Submitted by:{" "}
                      <span className="font-semibold">{update.submitted_by || "Anonymous"}</span>
                    </p>
                    {update.user_email && (
                      <p className="text-xs text-muted-foreground">{update.user_email}</p>
                    )}
                  </div>

                  {/* Actions */}
                  {isEditing ? (
                    <button
                      onClick={() => handleSaveEdit(update.id)}
                      disabled={saving || !editState.title.trim() || !editState.link.trim()}
                      className="flex w-full items-center justify-center gap-2 rounded-lg bg-orange-500 px-4 py-2.5 text-sm font-bold text-white transition-colors hover:bg-orange-600 disabled:opacity-50"
                    >
                      <Save className="h-4 w-4" />
                      {saving ? "Saving..." : "Save Changes"}
                    </button>
                  ) : activeTab === "pending" ? (
                    <div className="flex gap-3">
                      <button
                        onClick={() => handleReject(update.id)}
                        disabled={processing[update.id]}
                        className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-red-100 px-4 py-2.5 text-sm font-bold text-red-700 transition-colors hover:bg-red-200 disabled:opacity-50"
                      >
                        <X className="h-4 w-4" />
                        Reject
                      </button>
                      <button
                        onClick={() => handleApprove(update.id)}
                        disabled={processing[update.id]}
                        className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-green-100 px-4 py-2.5 text-sm font-bold text-green-700 transition-colors hover:bg-green-200 disabled:opacity-50"
                      >
                        <Check className="h-4 w-4" />
                        Approve
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setEditingId(update.id)}
                      className="flex w-full items-center justify-center gap-2 rounded-lg border border-border bg-background px-4 py-2.5 text-sm font-bold text-foreground transition-colors hover:border-orange-400 hover:bg-orange-50"
                    >
                      <Pencil className="h-4 w-4" />
                      Edit
                    </button>
                  )}
                  )}
                </div>
              )
            })}
          </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
