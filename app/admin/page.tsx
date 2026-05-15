"use client"

import { useEffect, useState } from "react"
import { Check, X, ExternalLink, Clock } from "lucide-react"

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

export default function AdminDashboard() {
  const [updates, setUpdates] = useState<PendingUpdate[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [processing, setProcessing] = useState<Record<string, boolean>>({})

  useEffect(() => {
    fetchPendingUpdates()
  }, [])

  const fetchPendingUpdates = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/admin/pending-updates")
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
        body: JSON.stringify({ updateId: id, action: "approve" }),
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
        body: JSON.stringify({ updateId: id, action: "reject" }),
      })

      if (!response.ok) throw new Error("Failed to reject")

      setUpdates((prev) => prev.filter((u) => u.id !== id))
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to reject")
    } finally {
      setProcessing((prev) => ({ ...prev, [id]: false }))
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
    <div className="min-h-screen bg-background p-6">
      <div className="mx-auto max-w-4xl">
        <h1 className="font-serif text-4xl font-black text-foreground">Admin Dashboard</h1>
        <p className="mt-2 text-muted-foreground">Review and moderate timeline submissions</p>

        {error && (
          <div className="mt-6 rounded-lg bg-red-50 p-4 text-red-700">
            {error}
          </div>
        )}

        {loading ? (
          <div className="mt-6 text-center text-muted-foreground">Loading...</div>
        ) : updates.length === 0 ? (
          <div className="mt-6 rounded-lg border-2 border-dashed border-border bg-muted/50 p-8 text-center">
            <Clock className="mx-auto h-8 w-8 text-muted-foreground/50" />
            <p className="mt-2 text-muted-foreground">No pending submissions</p>
          </div>
        ) : (
          <div className="mt-6 space-y-4">
            <p className="text-sm font-medium text-muted-foreground">
              {updates.length} pending submission{updates.length !== 1 ? "s" : ""}
            </p>

            {updates.map((update) => (
              <div
                key={update.id}
                className="rounded-xl border-2 border-border bg-card p-6"
              >
                <div className="mb-4 flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="text-lg font-black text-foreground">{update.title}</h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Promise ID: <code className="font-mono">{update.promise_id}</code>
                    </p>
                  </div>
                </div>

                {update.description && (
                  <p className="mb-4 text-sm text-muted-foreground">{update.description}</p>
                )}

                <div className="mb-4 flex flex-wrap items-center gap-4">
                  <a
                    href={update.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-orange-600 hover:underline"
                  >
                    <ExternalLink className="h-4 w-4" />
                    View Article
                  </a>
                  <span className="text-xs text-muted-foreground">
                    {formatDate(update.created_at)}
                  </span>
                </div>

                <div className="mb-3 rounded-lg bg-muted/30 p-3">
                  <p className="text-xs font-medium text-muted-foreground">
                    Submitted by: <span className="font-semibold">{update.submitted_by || "Anonymous"}</span>
                  </p>
                  {update.user_email && (
                    <p className="text-xs text-muted-foreground">{update.user_email}</p>
                  )}
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => handleReject(update.id)}
                    disabled={processing[update.id]}
                    className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-red-100 px-4 py-2.5 text-sm font-bold text-red-700 transition-colors hover:bg-red-200 disabled:opacity-50"
                  >
                    <X className="h-4 w-4" />
                    Reject
                  </button>
                  <button
                    onClick={() => handleApprove(update.id)}
                    disabled={processing[update.id]}
                    className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-green-100 px-4 py-2.5 text-sm font-bold text-green-700 transition-colors hover:bg-green-200 disabled:opacity-50"
                  >
                    <Check className="h-4 w-4" />
                    Approve
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
