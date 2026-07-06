"use client"

import { useEffect, useState, useCallback } from "react"
import { useAuth } from "@clerk/nextjs"
import {
  Check,
  X,
  ExternalLink,
  Clock,
  ShieldX,
  Pencil,
  Save,
  XCircle,
  Plus,
  Trash2,
  MapPin,
  FolderOpen,
  FileText,
  Mail,
  Send,
  Users,
  UserCheck,
  Search,
  Loader2,
  Megaphone,
} from "lucide-react"

// Types
interface State {
  id: string
  name: string
  party: string
  start_date: string
  flag_colors: string[]
}

interface Category {
  id: string
  state_id: string
  name: string
  icon: string
  color: string
  sort_order: number
  state_name?: string
}

interface Promise {
  id: string
  category_id: string
  state_id: string
  title: string
  description?: string
  source?: string
  sort_order: number
  category_name?: string
  state_name?: string
}

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

type AdminTab = "submissions" | "states" | "categories" | "promises" | "email" | "notice"

export default function AdminDashboard() {
  const { isSignedIn, isLoaded, userId } = useAuth()
  const [activeTab, setActiveTab] = useState<AdminTab>("submissions")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [accessDenied, setAccessDenied] = useState(false)

  // Submissions state
  const [updates, setUpdates] = useState<PendingUpdate[]>([])
  const [submissionTab, setSubmissionTab] = useState<"pending" | "approved">("pending")
  const [processing, setProcessing] = useState<Record<string, boolean>>({})
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editState, setEditState] = useState({ title: "", link: "", description: "" })
  const [saving, setSaving] = useState(false)

  // States management
  const [states, setStates] = useState<State[]>([])
  const [showStateForm, setShowStateForm] = useState(false)
  const [stateForm, setStateForm] = useState({ id: "", name: "", party: "", startDate: "" })
  const [editingStateId, setEditingStateId] = useState<string | null>(null)

  // Categories management
  const [categories, setCategories] = useState<Category[]>([])
  const [showCategoryForm, setShowCategoryForm] = useState(false)
  const [categoryForm, setCategoryForm] = useState({ id: "", stateId: "", name: "", icon: "FileText", color: "#FF9933" })
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null)
  const [selectedCategoryStateFilter, setSelectedCategoryStateFilter] = useState<string>("")

  // Promises management
  const [promises, setPromises] = useState<Promise[]>([])
  const [showPromiseForm, setShowPromiseForm] = useState(false)
  const [promiseForm, setPromiseForm] = useState({ id: "", categoryId: "", stateId: "", title: "", description: "", source: "" })
  const [editingPromiseId, setEditingPromiseId] = useState<string | null>(null)
  const [selectedStateFilter, setSelectedStateFilter] = useState<string>("")
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>("")

  // Email broadcast state
  const [emailSubject, setEmailSubject] = useState("")
  const [emailBody, setEmailBody] = useState("")
  const [emailRecipientType, setEmailRecipientType] = useState<"all" | "specific">("all")
  const [userSearchQuery, setUserSearchQuery] = useState("")
  const [userSearchResults, setUserSearchResults] = useState<{ id: string; name: string; email: string }[]>([])
  const [selectedUsers, setSelectedUsers] = useState<{ id: string; name: string; email: string }[]>([])
  const [searchingUsers, setSearchingUsers] = useState(false)
  const [sendingEmail, setSendingEmail] = useState(false)
  const [emailResult, setEmailResult] = useState<{ sent: number; failed: number; noEmail: number; total: number } | null>(null)
  const [emailError, setEmailError] = useState("")
  const [showPreview, setShowPreview] = useState(false)

  // Notice state
  const [noticeForm, setNoticeForm] = useState({ id: "", type: "NOTICE", headline: "", body: "", url: "", url_text: "", is_active: true })
  const [savingNotice, setSavingNotice] = useState(false)

  // Fetch functions — defined with useCallback so they can be stable deps
  const fetchUpdates = useCallback(async (status: "pending" | "approved") => {
    const response = await fetch(`/api/admin/pending-updates?userId=${userId}&status=${status}`)
    if (response.status === 403) { setAccessDenied(true); return }
    if (!response.ok) throw new Error("Failed to fetch updates")
    setUpdates(await response.json())
  }, [userId])

  const fetchStates = useCallback(async () => {
    const response = await fetch("/api/admin/states")
    if (!response.ok) throw new Error("Failed to fetch states")
    setStates(await response.json())
  }, [])

  const fetchCategories = useCallback(async (stateId: string = "") => {
    const url = stateId
      ? `/api/admin/categories?stateId=${stateId}`
      : "/api/admin/categories"
    const response = await fetch(url)
    if (!response.ok) throw new Error("Failed to fetch categories")
    const data = await response.json()
    setCategories(data)
  }, [])

  const fetchPromises = useCallback(async (stateId: string = "", categoryId: string = "") => {
    const params = new URLSearchParams()
    if (categoryId) params.append("categoryId", categoryId)
    else if (stateId) params.append("stateId", stateId)
    const url = params.toString() ? `/api/admin/promises?${params}` : "/api/admin/promises"
    const response = await fetch(url)
    if (!response.ok) throw new Error("Failed to fetch promises")
    setPromises(await response.json())
  }, [])

  const fetchNotice = useCallback(async () => {
    const response = await fetch("/api/notice")
    if (!response.ok) throw new Error("Failed to fetch notice")
    const data = await response.json()
    if (data.notice) {
      setNoticeForm({
        id: data.notice.id,
        type: data.notice.type,
        headline: data.notice.headline,
        body: data.notice.body || "",
        url: data.notice.url || "",
        url_text: data.notice.url_text || "",
        is_active: data.notice.is_active,
      })
    } else {
      setNoticeForm({ id: "", type: "NOTICE", headline: "", body: "", url: "", url_text: "", is_active: true })
    }
  }, [])

  // Main tab loader
  useEffect(() => {
    if (!isLoaded) return

    const load = async () => {
      setLoading(true)
      setError("")
      try {
        switch (activeTab) {
          case "submissions":
            // submissions requires auth
            if (userId) await fetchUpdates(submissionTab)
            break
          case "states":
            await fetchStates()
            break
          case "categories":
            await fetchStates()
            await fetchCategories(selectedCategoryStateFilter)
            break
          case "promises":
            await fetchStates()
            await fetchCategories("")
            await fetchPromises(selectedStateFilter, selectedCategoryFilter)
            break
          case "notice":
            await fetchNotice()
            break
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load data")
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [isLoaded, userId, activeTab, submissionTab, fetchStates, fetchUpdates, fetchCategories, fetchPromises])

  // Re-fetch categories when category-tab state filter changes
  useEffect(() => {
    if (activeTab === "categories") fetchCategories(selectedCategoryStateFilter)
  }, [selectedCategoryStateFilter, activeTab, fetchCategories])

  // Re-fetch promises when filters change
  useEffect(() => {
    if (activeTab === "promises") fetchPromises(selectedStateFilter, selectedCategoryFilter)
  }, [selectedStateFilter, selectedCategoryFilter, activeTab, fetchPromises])

  // Submission handlers
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

  const startEditingSubmission = (update: PendingUpdate) => {
    setEditingId(update.id)
    setEditState({ title: update.title, link: update.link, description: update.description || "" })
  }

  const handleSaveSubmission = async (id: string) => {
    if (!editState.title.trim() || !editState.link.trim()) return
    try {
      setSaving(true)
      const response = await fetch("/api/admin/pending-updates", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ updateId: id, ...editState, userId }),
      })
      if (!response.ok) throw new Error("Failed to save")
      setUpdates((prev) => prev.map((u) => (u.id === id ? { ...u, ...editState } : u)))
      setEditingId(null)
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to save")
    } finally {
      setSaving(false)
    }
  }

  // State handlers
  const handleSaveState = async () => {
    if (!stateForm.id || !stateForm.name || !stateForm.party || !stateForm.startDate) {
      alert("All fields are required")
      return
    }
    try {
      setSaving(true)
      const method = editingStateId ? "PUT" : "POST"
      const response = await fetch("/api/admin/states", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(stateForm),
      })
      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Failed to save state")
      }
      await fetchStates()
      setShowStateForm(false)
      setEditingStateId(null)
      setStateForm({ id: "", name: "", party: "", startDate: "" })
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to save")
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteState = async (id: string) => {
    if (!confirm("Delete this state? This will also delete all categories and promises in it.")) return
    try {
      const response = await fetch(`/api/admin/states?id=${id}`, { method: "DELETE" })
      if (!response.ok) throw new Error("Failed to delete")
      await fetchStates()
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to delete")
    }
  }

  const startEditingState = (state: State) => {
    setEditingStateId(state.id)
    setStateForm({
      id: state.id,
      name: state.name,
      party: state.party,
      startDate: state.start_date.split("T")[0],
    })
    setShowStateForm(true)
  }

  // Category handlers
  const handleSaveCategory = async () => {
    if (!categoryForm.id || !categoryForm.stateId || !categoryForm.name) {
      alert("ID, State, and Name are required")
      return
    }
    try {
      setSaving(true)
      const method = editingCategoryId ? "PUT" : "POST"
      const response = await fetch("/api/admin/categories", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(categoryForm),
      })
      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Failed to save category")
      }
      await fetchCategories()
      setShowCategoryForm(false)
      setEditingCategoryId(null)
      setCategoryForm({ id: "", stateId: "", name: "", icon: "FileText", color: "#FF9933" })
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to save")
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteCategory = async (id: string) => {
    if (!confirm("Delete this category? This will also delete all promises in it.")) return
    try {
      const response = await fetch(`/api/admin/categories?id=${id}`, { method: "DELETE" })
      if (!response.ok) throw new Error("Failed to delete")
      await fetchCategories()
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to delete")
    }
  }

  const startEditingCategory = (cat: Category) => {
    setEditingCategoryId(cat.id)
    setCategoryForm({
      id: cat.id,
      stateId: cat.state_id,
      name: cat.name,
      icon: cat.icon,
      color: cat.color,
    })
    setShowCategoryForm(true)
  }

  // Promise handlers
  const handleSavePromise = async () => {
    if (!promiseForm.id || !promiseForm.categoryId || !promiseForm.stateId || !promiseForm.title) {
      alert("ID, Category, State, and Title are required")
      return
    }
    try {
      setSaving(true)
      const method = editingPromiseId ? "PUT" : "POST"
      const response = await fetch("/api/admin/promises", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(promiseForm),
      })
      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Failed to save promise")
      }
      await fetchPromises()
      setShowPromiseForm(false)
      setEditingPromiseId(null)
      setPromiseForm({ id: "", categoryId: "", stateId: "", title: "", description: "", source: "" })
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to save")
    } finally {
      setSaving(false)
    }
  }

  const handleDeletePromise = async (id: string) => {
    if (!confirm("Delete this promise?")) return
    try {
      const response = await fetch(`/api/admin/promises?id=${id}`, { method: "DELETE" })
      if (!response.ok) throw new Error("Failed to delete")
      await fetchPromises()
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to delete")
    }
  }

  const startEditingPromise = (promise: Promise) => {
    setEditingPromiseId(promise.id)
    setPromiseForm({
      id: promise.id,
      categoryId: promise.category_id,
      stateId: promise.state_id,
      title: promise.title,
      description: promise.description || "",
      source: promise.source || "",
    })
    setShowPromiseForm(true)
  }

  // Notice Handlers
  const handleSaveNotice = async () => {
    if (!noticeForm.headline) {
      alert("Headline is required")
      return
    }
    try {
      setSavingNotice(true)
      const response = await fetch("/api/admin/notice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(noticeForm),
      })
      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Failed to save notice")
      }
      alert("Notice saved successfully!")
      await fetchNotice()
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to save notice")
    } finally {
      setSavingNotice(false)
    }
  }

  const handleDeactivateNotice = async () => {
    if (!noticeForm.id) return
    try {
      setSavingNotice(true)
      const response = await fetch("/api/admin/notice", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: noticeForm.id, is_active: false }),
      })
      if (!response.ok) throw new Error("Failed to deactivate notice")
      alert("Notice deactivated!")
      await fetchNotice()
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to deactivate notice")
    } finally {
      setSavingNotice(false)
    }
  }

  const formatDate = (timestamp: string) => {
    return new Date(timestamp).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    })
  }

  // Render access denied or loading
  if (!isLoaded || (loading && activeTab === "submissions")) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="mx-auto max-w-5xl text-center text-muted-foreground">Loading...</div>
      </div>
    )
  }

  if (accessDenied || !isSignedIn) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="mx-auto max-w-5xl">
          <div className="mt-10 rounded-xl border-2 border-red-200 bg-red-50 p-8 text-center">
            <ShieldX className="mx-auto h-12 w-12 text-red-500" />
            <h2 className="mt-4 text-xl font-black text-red-700">Access Denied</h2>
            <p className="mt-2 text-red-600">
              {!isSignedIn ? "You must be signed in to access this page." : "You do not have admin privileges."}
            </p>
            <a href="/" className="mt-6 inline-block rounded-lg bg-red-600 px-6 py-2.5 text-sm font-bold text-white hover:bg-red-700">
              Go Back Home
            </a>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="mx-auto max-w-5xl">
        <h1 className="font-serif text-4xl font-black text-foreground">Admin Dashboard</h1>
        <p className="mt-2 text-muted-foreground">Manage states, categories, promises, and submissions</p>

        {/* Main Tabs */}
        <div className="mt-6 flex flex-wrap gap-2 border-b border-border">
          {[
            { id: "submissions", label: "Submissions", icon: Clock },
            { id: "states", label: "States", icon: MapPin },
            { id: "categories", label: "Categories", icon: FolderOpen },
            { id: "promises", label: "Promises", icon: FileText },
            { id: "email", label: "Send Email", icon: Mail },
            { id: "notice", label: "Notice Board", icon: Megaphone },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as AdminTab)}
              className={`flex items-center gap-2 px-4 py-2 font-semibold transition-colors ${
                activeTab === tab.id
                  ? "border-b-2 border-orange-500 text-orange-600"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <tab.icon className="h-4 w-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {error && <div className="mt-4 rounded-lg bg-red-50 p-4 text-red-700">{error}</div>}

        {/* Submissions Tab */}
        {activeTab === "submissions" && (
          <div className="mt-6">
        <div className="flex gap-1 overflow-x-auto border-b border-border">
          {[
            { id: "pending", label: "Pending Review", icon: Clock },
            { id: "approved", label: "Approved", icon: Check },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setSubmissionTab(tab.id as any)}
              className={`flex items-center gap-1 whitespace-nowrap px-2 py-3 text-sm font-semibold transition-colors sm:gap-2 sm:px-4 sm:text-base ${
                submissionTab === tab.id
                  ? "border-b-2 border-orange-500 text-orange-600"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <tab.icon className="h-4 w-4 flex-shrink-0" />
              <span className="hidden sm:inline">{tab.label}</span>
              <span className="sm:hidden">{tab.label.split(" ")[0]}</span>
            </button>
          ))}
        </div>

            {loading ? (
              <div className="mt-6 text-center text-sm text-muted-foreground">Loading...</div>
            ) : updates.length === 0 ? (
              <div className="mt-6 rounded-lg border-2 border-dashed border-border bg-muted/50 p-6 text-center sm:p-8">
                <Clock className="mx-auto h-6 w-6 text-muted-foreground/50 sm:h-8 sm:w-8" />
                <p className="mt-2 text-xs text-muted-foreground sm:text-sm">No {submissionTab} submissions</p>
              </div>
            ) : (
              <div className="mt-6 space-y-3 sm:space-y-4">
                {updates.map((update) => {
                  const isEditing = editingId === update.id
                  return (
                    <div key={update.id} className="rounded-lg border-2 border-border bg-card p-4 sm:rounded-xl sm:p-6">
                      <div className="mb-3 flex flex-col gap-2 sm:mb-4 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
                        <div className="flex-1 min-w-0">
                          {isEditing ? (
                            <input
                              type="text"
                              value={editState.title}
                              onChange={(e) => setEditState((s) => ({ ...s, title: e.target.value }))}
                              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm font-black sm:text-base"
                            />
                          ) : (
                            <div className="flex flex-wrap items-center gap-2">
                              <h3 className="text-base font-black text-foreground sm:text-lg">{update.title}</h3>
                              {update.impact === "setback" && (
                                <span className="inline-flex items-center gap-1 rounded-md bg-rose-100 dark:bg-rose-950/50 border border-rose-300 dark:border-rose-800 px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-rose-700 dark:text-rose-300">
                                  ⚠️ Setback / Hampered
                                </span>
                              )}
                              {update.impact === "progress" && (
                                <span className="inline-flex items-center gap-1 rounded-md bg-green-100 dark:bg-green-950/50 border border-green-300 dark:border-green-800 px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-green-700 dark:text-green-300">
                                  📈 Progress
                                </span>
                              )}
                            </div>
                          )}
                          <p className="mt-1 truncate text-[10px] text-muted-foreground font-mono sm:text-xs">{update.promise_id}</p>
                        </div>
                        <button
                          onClick={() => (isEditing ? setEditingId(null) : startEditingSubmission(update))}
                          className="flex items-center justify-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-bold text-muted-foreground hover:border-orange-400 active:scale-95 sm:justify-start"
                        >
                          {isEditing ? <XCircle className="h-3.5 w-3.5" /> : <Pencil className="h-3.5 w-3.5" />}
                          <span className="hidden sm:inline">{isEditing ? "Cancel" : "Edit"}</span>
                        </button>
                      </div>

                      {isEditing ? (
                        <>
                          <textarea
                            value={editState.description}
                            onChange={(e) => setEditState((s) => ({ ...s, description: e.target.value }))}
                            rows={2}
                            className="mb-4 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                            placeholder="Description"
                          />
                          <input
                            type="url"
                            value={editState.link}
                            onChange={(e) => setEditState((s) => ({ ...s, link: e.target.value }))}
                            className="mb-4 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                            placeholder="Link"
                          />
                          <button
                            onClick={() => handleSaveSubmission(update.id)}
                            disabled={saving}
                            className="flex w-full items-center justify-center gap-2 rounded-lg bg-orange-500 px-4 py-2.5 text-sm font-bold text-white hover:bg-orange-600 disabled:opacity-50"
                          >
                            <Save className="h-4 w-4" />
                            {saving ? "Saving..." : "Save Changes"}
                          </button>
                        </>
                      ) : (
                        <>
                          {update.description && <p className="mb-4 text-sm text-muted-foreground">{update.description}</p>}
                          <div className="mb-4 flex items-center gap-4">
                            <a href={update.link} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-orange-600 hover:underline">
                              <ExternalLink className="h-4 w-4" />
                              View Article
                            </a>
                            <span className="text-xs text-muted-foreground">{formatDate(update.created_at)}</span>
                          </div>
                          <div className="mb-4 rounded-lg bg-muted/30 p-3">
                            <p className="text-xs text-muted-foreground">
                              Submitted by: <span className="font-semibold">{update.submitted_by || "Anonymous"}</span>
                            </p>
                            {update.user_email && <p className="text-xs text-muted-foreground">{update.user_email}</p>}
                          </div>
                          {submissionTab === "pending" && (
                            <div className="flex gap-3">
                              <button
                                onClick={() => handleReject(update.id)}
                                disabled={processing[update.id]}
                                className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-red-100 px-4 py-2.5 text-sm font-bold text-red-700 hover:bg-red-200 disabled:opacity-50"
                              >
                                <X className="h-4 w-4" />
                                Reject
                              </button>
                              <button
                                onClick={() => handleApprove(update.id)}
                                disabled={processing[update.id]}
                                className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-green-100 px-4 py-2.5 text-sm font-bold text-green-700 hover:bg-green-200 disabled:opacity-50"
                              >
                                <Check className="h-4 w-4" />
                                Approve
                              </button>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* States Tab */}
        {activeTab === "states" && (
          <div className="mt-4 sm:mt-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
              <h2 className="text-base font-black sm:text-lg">Manage States</h2>
              <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:gap-3">
                <button
                  onClick={async () => {
                    if (confirm("This will migrate West Bengal data from the config file to the database. Continue?")) {
                      setLoading(true)
                      try {
                        const res = await fetch("/api/admin/migrate?key=migrate-data-2026")
                        const data = await res.json()
                        if (res.ok) {
                          alert(`Migration complete! ${data.categories} categories and ${data.promises} promises migrated.`)
                          fetchStates()
                        } else {
                          alert(`Migration failed: ${data.error}`)
                        }
                      } catch (err) {
                        alert("Migration failed")
                      } finally {
                        setLoading(false)
                      }
                    }
                  }}
                  className="flex items-center justify-center gap-2 rounded-lg border border-orange-300 bg-orange-50 px-3 py-2 text-xs font-bold text-orange-700 hover:bg-orange-100 sm:px-4 sm:py-2 sm:text-sm"
                >
                  Migrate WB Data
                </button>
                <button
                  onClick={() => {
                    setShowStateForm(true)
                    setEditingStateId(null)
                    setStateForm({ id: "", name: "", party: "", startDate: "" })
                  }}
                  className="flex items-center justify-center gap-2 rounded-lg bg-orange-500 px-3 py-2 text-xs font-bold text-white hover:bg-orange-600 sm:px-4 sm:py-2 sm:text-sm"
                >
                  <Plus className="h-4 w-4 flex-shrink-0" />
                  <span>Add State</span>
                </button>
              </div>
            </div>

            {showStateForm && (
              <div className="mt-4 rounded-lg border-2 border-orange-200 bg-orange-50 p-4 sm:rounded-xl sm:p-6">
                <h3 className="mb-4 text-sm font-bold sm:text-base">{editingStateId ? "Edit State" : "Add New State"}</h3>
                <div className="grid gap-3 sm:gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-[10px] font-bold text-muted-foreground sm:text-xs">ID (slug)</label>
                    <input
                      type="text"
                      value={stateForm.id}
                      onChange={(e) => setStateForm((s) => ({ ...s, id: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-") }))}
                      disabled={!!editingStateId}
                      className="h-9 w-full rounded-lg border border-border bg-background px-3 text-sm disabled:opacity-50 sm:h-10"
                      placeholder="west-bengal"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-[10px] font-bold text-muted-foreground sm:text-xs">Name</label>
                    <input
                      type="text"
                      value={stateForm.name}
                      onChange={(e) => setStateForm((s) => ({ ...s, name: e.target.value }))}
                      className="h-9 w-full rounded-lg border border-border bg-background px-3 text-sm sm:h-10"
                      placeholder="West Bengal"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-bold text-muted-foreground">Ruling Party</label>
                    <input
                      type="text"
                      value={stateForm.party}
                      onChange={(e) => setStateForm((s) => ({ ...s, party: e.target.value }))}
                      className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                      placeholder="BJP"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-bold text-muted-foreground">Oath Ceremony Date</label>
                    <input
                      type="date"
                      value={stateForm.startDate}
                      onChange={(e) => setStateForm((s) => ({ ...s, startDate: e.target.value }))}
                      className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                    />
                  </div>
                </div>
                <div className="mt-4 flex gap-3">
                  <button
                    onClick={() => setShowStateForm(false)}
                    className="flex-1 rounded-lg border border-border px-4 py-2 text-sm font-bold hover:bg-muted/50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveState}
                    disabled={saving}
                    className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-orange-500 px-4 py-2 text-sm font-bold text-white hover:bg-orange-600 disabled:opacity-50"
                  >
                    <Save className="h-4 w-4" />
                    {saving ? "Saving..." : "Save State"}
                  </button>
                </div>
              </div>
            )}

            {loading ? (
              <div className="mt-6 text-center text-muted-foreground">Loading...</div>
            ) : states.length === 0 ? (
              <div className="mt-6 rounded-lg border-2 border-dashed border-border bg-muted/50 p-8 text-center">
                <MapPin className="mx-auto h-8 w-8 text-muted-foreground/50" />
                <p className="mt-2 text-muted-foreground">No states yet. Add your first state!</p>
              </div>
            ) : (
              <div className="mt-6 space-y-3">
                {states.map((state) => (
                  <div key={state.id} className="flex items-center justify-between rounded-xl border-2 border-border bg-card p-4">
                    <div>
                      <h3 className="font-bold text-foreground">{state.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        {state.party} &bull; Since {formatDate(state.start_date)}
                      </p>
                      <p className="text-xs font-mono text-muted-foreground/70">{state.id}</p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => startEditingState(state)}
                        className="rounded-lg border border-border p-2 text-muted-foreground hover:border-orange-400 hover:text-orange-600"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteState(state.id)}
                        className="rounded-lg border border-border p-2 text-muted-foreground hover:border-red-400 hover:text-red-600"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Categories Tab */}
        {activeTab === "categories" && (
          <div className="mt-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <h2 className="text-lg font-black">Manage Categories</h2>
              <div className="flex items-center gap-3">
                <select
                  value={selectedCategoryStateFilter}
                  onChange={(e) => {
                    const s = e.target.value
                    setSelectedCategoryStateFilter(s)
                    fetchCategories(s)
                  }}
                  className="rounded-lg border border-border bg-background px-3 py-2 text-sm"
                >
                  <option value="">All States</option>
                  {states.map((s) => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
                <button
                  onClick={() => {
                    setShowCategoryForm(true)
                    setEditingCategoryId(null)
                    setCategoryForm({ id: "", stateId: selectedCategoryStateFilter, name: "", icon: "FileText", color: "#FF9933" })
                  }}
                  className="flex items-center gap-2 rounded-lg bg-orange-500 px-4 py-2 text-sm font-bold text-white hover:bg-orange-600"
                >
                  <Plus className="h-4 w-4" />
                  Add Category
                </button>
              </div>
            </div>

            {showCategoryForm && (
              <div className="mt-4 rounded-xl border-2 border-orange-200 bg-orange-50 p-6">
                <h3 className="mb-4 font-bold">{editingCategoryId ? "Edit Category" : "Add New Category"}</h3>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-xs font-bold text-muted-foreground">ID</label>
                    <input
                      type="text"
                      value={categoryForm.id}
                      onChange={(e) => setCategoryForm((s) => ({ ...s, id: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-") }))}
                      disabled={!!editingCategoryId}
                      className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm disabled:opacity-50"
                      placeholder="education"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-bold text-muted-foreground">State</label>
                    <select
                      value={categoryForm.stateId}
                      onChange={(e) => setCategoryForm((s) => ({ ...s, stateId: e.target.value }))}
                      disabled={!!editingCategoryId}
                      className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm disabled:opacity-50"
                    >
                      <option value="">Select state...</option>
                      {states.map((s) => (
                        <option key={s.id} value={s.id}>{s.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-bold text-muted-foreground">Name</label>
                    <input
                      type="text"
                      value={categoryForm.name}
                      onChange={(e) => setCategoryForm((s) => ({ ...s, name: e.target.value }))}
                      className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                      placeholder="Education"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-bold text-muted-foreground">Color</label>
                    <input
                      type="color"
                      value={categoryForm.color}
                      onChange={(e) => setCategoryForm((s) => ({ ...s, color: e.target.value }))}
                      className="h-10 w-full rounded-lg border border-border bg-background"
                    />
                  </div>
                </div>
                <div className="mt-4 flex gap-3">
                  <button onClick={() => setShowCategoryForm(false)} className="flex-1 rounded-lg border border-border px-4 py-2 text-sm font-bold hover:bg-muted/50">
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveCategory}
                    disabled={saving}
                    className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-orange-500 px-4 py-2 text-sm font-bold text-white hover:bg-orange-600 disabled:opacity-50"
                  >
                    <Save className="h-4 w-4" />
                    {saving ? "Saving..." : "Save Category"}
                  </button>
                </div>
              </div>
            )}

            {loading ? (
              <div className="mt-6 text-center text-muted-foreground">Loading...</div>
            ) : categories.length === 0 ? (
              <div className="mt-6 rounded-lg border-2 border-dashed border-border bg-muted/50 p-8 text-center">
                <FolderOpen className="mx-auto h-8 w-8 text-muted-foreground/50" />
                <p className="mt-2 text-muted-foreground">No categories yet. Add a state first, then create categories.</p>
              </div>
            ) : (
              <div className="mt-6 space-y-3">
                {categories.map((cat) => (
                  <div key={cat.id} className="flex items-center justify-between rounded-xl border-2 border-border bg-card p-4">
                    <div className="flex items-center gap-3">
                      <div className="h-4 w-4 rounded-full" style={{ backgroundColor: cat.color }} />
                      <div>
                        <h3 className="font-bold text-foreground">{cat.name}</h3>
                        <p className="text-xs text-muted-foreground">{cat.state_name || cat.state_id}</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => startEditingCategory(cat)}
                        className="rounded-lg border border-border p-2 text-muted-foreground hover:border-orange-400 hover:text-orange-600"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteCategory(cat.id)}
                        className="rounded-lg border border-border p-2 text-muted-foreground hover:border-red-400 hover:text-red-600"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Promises Tab */}
        {activeTab === "promises" && (
          <div className="mt-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <h2 className="text-lg font-black">Manage Promises</h2>
              <div className="flex flex-wrap items-center gap-3">
                <select
                  value={selectedStateFilter}
                  onChange={(e) => {
                    const s = e.target.value
                    setSelectedStateFilter(s)
                    setSelectedCategoryFilter("")
                    fetchPromises(s, "")
                  }}
                  className="rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground"
                >
                  <option value="">All States</option>
                  {states.map((s) => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
                <select
                  value={selectedCategoryFilter}
                  onChange={(e) => {
                    const c = e.target.value
                    setSelectedCategoryFilter(c)
                    fetchPromises(selectedStateFilter, c)
                  }}
                  className="rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground"
                >
                  <option value="">All Categories</option>
                  {categories
                    .filter((c) => !selectedStateFilter || c.state_id === selectedStateFilter)
                    .map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))
                  }
                </select>
                <button
                  onClick={() => {
                    setShowPromiseForm(true)
                    setEditingPromiseId(null)
                    setPromiseForm({ id: "", categoryId: "", stateId: selectedStateFilter, title: "", description: "", source: "" })
                  }}
                  className="flex items-center gap-2 rounded-lg bg-orange-500 px-4 py-2 text-sm font-bold text-white hover:bg-orange-600"
                >
                  <Plus className="h-4 w-4" />
                  Add Promise
                </button>
              </div>
            </div>

            {showPromiseForm && (
              <div className="mt-4 rounded-xl border-2 border-orange-200 bg-orange-50 p-6">
                <h3 className="mb-4 font-bold">{editingPromiseId ? "Edit Promise" : "Add New Promise"}</h3>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-xs font-bold text-muted-foreground">ID</label>
                    <input
                      type="text"
                      value={promiseForm.id}
                      onChange={(e) => setPromiseForm((s) => ({ ...s, id: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-") }))}
                      disabled={!!editingPromiseId}
                      className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm disabled:opacity-50"
                      placeholder="promise-001"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-bold text-muted-foreground">State</label>
                    <select
                      value={promiseForm.stateId}
                      onChange={(e) => setPromiseForm((s) => ({ ...s, stateId: e.target.value, categoryId: "" }))}
                      disabled={!!editingPromiseId}
                      className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm disabled:opacity-50"
                    >
                      <option value="">Select state...</option>
                      {states.map((s) => (
                        <option key={s.id} value={s.id}>{s.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-bold text-muted-foreground">Category</label>
                    <select
                      value={promiseForm.categoryId}
                      onChange={(e) => setPromiseForm((s) => ({ ...s, categoryId: e.target.value }))}
                      disabled={!!editingPromiseId}
                      className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm disabled:opacity-50"
                    >
                      <option value="">Select category...</option>
                      {categories
                        .filter((c) => c.state_id === promiseForm.stateId)
                        .map((c) => (
                          <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                    </select>
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-bold text-muted-foreground">Title</label>
                    <input
                      type="text"
                      value={promiseForm.title}
                      onChange={(e) => setPromiseForm((s) => ({ ...s, title: e.target.value }))}
                      className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                      placeholder="Promise title..."
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="mb-1 block text-xs font-bold text-muted-foreground">Description (optional)</label>
                    <textarea
                      value={promiseForm.description}
                      onChange={(e) => setPromiseForm((s) => ({ ...s, description: e.target.value }))}
                      rows={2}
                      className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                      placeholder="Additional details..."
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="mb-1 block text-xs font-bold text-muted-foreground">Source URL (optional)</label>
                    <input
                      type="url"
                      value={promiseForm.source}
                      onChange={(e) => setPromiseForm((s) => ({ ...s, source: e.target.value }))}
                      className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                      placeholder="https://..."
                    />
                  </div>
                </div>
                <div className="mt-4 flex gap-3">
                  <button onClick={() => setShowPromiseForm(false)} className="flex-1 rounded-lg border border-border px-4 py-2 text-sm font-bold hover:bg-muted/50">
                    Cancel
                  </button>
                  <button
                    onClick={handleSavePromise}
                    disabled={saving}
                    className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-orange-500 px-4 py-2 text-sm font-bold text-white hover:bg-orange-600 disabled:opacity-50"
                  >
                    <Save className="h-4 w-4" />
                    {saving ? "Saving..." : "Save Promise"}
                  </button>
                </div>
              </div>
            )}

            {loading ? (
              <div className="mt-6 text-center text-muted-foreground">Loading...</div>
            ) : promises.length === 0 ? (
              <div className="mt-6 rounded-lg border-2 border-dashed border-border bg-muted/50 p-8 text-center">
                <FileText className="mx-auto h-8 w-8 text-muted-foreground/50" />
                <p className="mt-2 text-muted-foreground">No promises yet. Add states and categories first.</p>
              </div>
            ) : (
              <div className="mt-6 space-y-3">
                {promises.map((promise) => (
                  <div key={promise.id} className="flex items-center justify-between rounded-xl border-2 border-border bg-card p-4">
                    <div className="min-w-0 flex-1">
                      <h3 className="truncate font-bold text-foreground">{promise.title}</h3>
                      <p className="text-xs text-muted-foreground">
                        {promise.category_name} &bull; {promise.state_name || promise.state_id}
                      </p>
                      {promise.description && (
                        <p className="mt-1 truncate text-xs text-muted-foreground/70">{promise.description}</p>
                      )}
                    </div>
                    <div className="ml-4 flex gap-2">
                      <button
                        onClick={() => startEditingPromise(promise)}
                        className="rounded-lg border border-border p-2 text-muted-foreground hover:border-orange-400 hover:text-orange-600"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDeletePromise(promise.id)}
                        className="rounded-lg border border-border p-2 text-muted-foreground hover:border-red-400 hover:text-red-600"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Email Tab */}
        {activeTab === "email" && (
          <div className="mt-6 space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-black text-foreground">Broadcast Email</h2>
                <p className="text-sm text-muted-foreground mt-0.5">Send a custom email to all users or a selected group</p>
              </div>
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
              {/* Compose Form */}
              <div className="space-y-4 rounded-2xl border-2 border-border bg-card p-6">
                <h3 className="font-black text-foreground flex items-center gap-2">
                  <Mail className="h-4 w-4 text-orange-500" /> Compose
                </h3>

                {/* Recipients */}
                <div>
                  <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-muted-foreground">Recipients</label>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setEmailRecipientType("all")}
                      className={`flex flex-1 items-center justify-center gap-2 rounded-xl border-2 py-2.5 text-sm font-bold transition-colors ${emailRecipientType === "all" ? "border-orange-500 bg-orange-50 text-orange-600 dark:bg-orange-950/20" : "border-border text-muted-foreground hover:border-orange-300"}`}
                    >
                      <Users className="h-4 w-4" /> All Users
                    </button>
                    <button
                      onClick={() => setEmailRecipientType("specific")}
                      className={`flex flex-1 items-center justify-center gap-2 rounded-xl border-2 py-2.5 text-sm font-bold transition-colors ${emailRecipientType === "specific" ? "border-orange-500 bg-orange-50 text-orange-600 dark:bg-orange-950/20" : "border-border text-muted-foreground hover:border-orange-300"}`}
                    >
                      <UserCheck className="h-4 w-4" /> Specific Users
                    </button>
                  </div>
                </div>

                {/* User search (specific mode) */}
                {emailRecipientType === "specific" && (
                  <div className="space-y-2">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <input
                        type="text"
                        value={userSearchQuery}
                        onChange={async (e) => {
                          setUserSearchQuery(e.target.value)
                          if (!e.target.value.trim()) { setUserSearchResults([]); return }
                          setSearchingUsers(true)
                          try {
                            const res = await fetch(`/api/admin/send-email?q=${encodeURIComponent(e.target.value)}`)
                            const d = await res.json()
                            setUserSearchResults(d.users ?? [])
                          } catch { /* ignore */ } finally { setSearchingUsers(false) }
                        }}
                        placeholder="Search by name or email..."
                        className="w-full rounded-xl border border-border bg-background py-2 pl-9 pr-3 text-sm focus:border-orange-500 focus:outline-none"
                      />
                      {searchingUsers && <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground" />}
                    </div>
                    {userSearchResults.length > 0 && (
                      <div className="rounded-xl border border-border bg-background shadow-sm max-h-48 overflow-y-auto">
                        {userSearchResults.map((u) => (
                          <button
                            key={u.id}
                            onClick={() => {
                              if (!selectedUsers.find((s) => s.id === u.id)) {
                                setSelectedUsers((prev) => [...prev, u])
                              }
                              setUserSearchResults([])
                              setUserSearchQuery("")
                            }}
                            className="flex w-full items-center gap-3 px-3 py-2 text-left hover:bg-muted/50 transition-colors"
                          >
                            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-orange-100 text-xs font-bold text-orange-600">
                              {u.name.charAt(0).toUpperCase()}
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-sm font-semibold text-foreground">{u.name}</p>
                              <p className="truncate text-xs text-muted-foreground">{u.email}</p>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                    {selectedUsers.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {selectedUsers.map((u) => (
                          <span key={u.id} className="flex items-center gap-1.5 rounded-full border border-border bg-muted px-2.5 py-1 text-xs font-semibold text-foreground">
                            {u.name}
                            <button onClick={() => setSelectedUsers((prev) => prev.filter((s) => s.id !== u.id))} className="text-muted-foreground hover:text-red-500">
                              <X className="h-3 w-3" />
                            </button>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Subject */}
                <div>
                  <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-muted-foreground">Subject</label>
                  <input
                    type="text"
                    value={emailSubject}
                    onChange={(e) => setEmailSubject(e.target.value)}
                    placeholder="Email subject..."
                    className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm focus:border-orange-500 focus:outline-none"
                  />
                </div>

                {/* Body */}
                <div>
                  <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-muted-foreground">Message</label>
                  <textarea
                    value={emailBody}
                    onChange={(e) => setEmailBody(e.target.value)}
                    rows={8}
                    placeholder={"Write your message here...\n\nEach new line becomes a paragraph."}
                    className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm focus:border-orange-500 focus:outline-none resize-none leading-relaxed"
                  />
                  <p className="mt-1 text-xs text-muted-foreground">{emailBody.length} characters</p>
                </div>

                {emailError && (
                  <div className="rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700 dark:bg-red-950/30 dark:text-red-400">
                    {emailError}
                  </div>
                )}

                <button
                  disabled={sendingEmail || !emailSubject.trim() || !emailBody.trim() || (emailRecipientType === "specific" && selectedUsers.length === 0)}
                  onClick={async () => {
                    setSendingEmail(true)
                    setEmailError("")
                    setEmailResult(null)
                    try {
                      const res = await fetch("/api/admin/send-email", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                          subject: emailSubject,
                          body: emailBody,
                          recipientType: emailRecipientType,
                          specificUserIds: emailRecipientType === "specific" ? selectedUsers.map((u) => u.id) : [],
                        }),
                      })
                      const d = await res.json()
                      if (!res.ok) { setEmailError(d.error || "Failed to send"); return }
                      setEmailResult(d)
                    } catch { setEmailError("Something went wrong. Try again.") } finally { setSendingEmail(false) }
                  }}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-orange-500 py-3 text-sm font-black text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {sendingEmail ? <><Loader2 className="h-4 w-4 animate-spin" /> Sending...</> : <><Send className="h-4 w-4" /> Send Email</>}
                </button>
              </div>

              {/* Preview + Result */}
              <div className="space-y-4">
                {/* Preview */}
                <div className="rounded-2xl border-2 border-border bg-card p-6">
                  <h3 className="mb-3 font-black text-foreground">Preview</h3>
                  <div className="rounded-xl border border-border bg-muted/30 p-4">
                    {/* Header */}
                    <div className="mb-3 rounded-lg bg-orange-500 px-4 py-3">
                      <p className="text-sm font-black text-white">The Manifesto</p>
                      <p className="text-[10px] font-medium uppercase tracking-widest text-orange-200">Citizen-powered accountability</p>
                    </div>
                    {/* Body */}
                    <div className="px-1 py-2">
                      {emailSubject ? (
                        <p className="mb-3 text-base font-black text-foreground">{emailSubject}</p>
                      ) : (
                        <p className="mb-3 text-base font-black text-muted-foreground/40">Your subject line</p>
                      )}
                      {emailBody ? (
                        emailBody.split("\n").map((line, i) => (
                          <p key={i} className="mb-2 text-sm leading-relaxed text-foreground/80">{line || <>&nbsp;</>}</p>
                        ))
                      ) : (
                        <p className="text-sm text-muted-foreground/40">Your message will appear here...</p>
                      )}
                    </div>
                    {/* Footer */}
                    <div className="mt-3 border-t border-border pt-3">
                      <p className="text-center text-[10px] text-muted-foreground">You received this because you have an account on The Manifesto</p>
                    </div>
                  </div>
                  <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
                    <Mail className="h-3.5 w-3.5" />
                    {emailRecipientType === "all"
                      ? "Will be sent to all users"
                      : selectedUsers.length > 0
                        ? `Will be sent to ${selectedUsers.length} selected user${selectedUsers.length !== 1 ? "s" : ""}`
                        : "No recipients selected yet"}
                  </div>
                </div>

                {/* Result */}
                {emailResult && (
                  <div className="rounded-2xl border-2 border-green-200 bg-green-50 p-6 dark:border-green-800 dark:bg-green-950/20">
                    <h3 className="mb-4 font-black text-green-800 dark:text-green-400">Email sent successfully</h3>
                    <div className="grid grid-cols-3 gap-3">
                      <div className="rounded-xl bg-green-100 p-3 text-center dark:bg-green-900/30">
                        <p className="text-2xl font-black text-green-700 dark:text-green-400">{emailResult.sent}</p>
                        <p className="text-xs font-semibold text-green-600">Delivered</p>
                      </div>
                      <div className="rounded-xl bg-amber-100 p-3 text-center dark:bg-amber-900/30">
                        <p className="text-2xl font-black text-amber-700 dark:text-amber-400">{emailResult.noEmail}</p>
                        <p className="text-xs font-semibold text-amber-600">No email</p>
                      </div>
                      <div className="rounded-xl bg-red-100 p-3 text-center dark:bg-red-900/30">
                        <p className="text-2xl font-black text-red-700 dark:text-red-400">{emailResult.failed}</p>
                        <p className="text-xs font-semibold text-red-600">Failed</p>
                      </div>
                    </div>
                    <p className="mt-3 text-center text-xs text-muted-foreground">{emailResult.total} total recipients processed</p>
                    <button
                      onClick={() => { setEmailResult(null); setEmailSubject(""); setEmailBody(""); setSelectedUsers([]) }}
                      className="mt-4 w-full rounded-xl border border-green-300 py-2 text-sm font-bold text-green-700 hover:bg-green-100 transition-colors"
                    >
                      Compose another
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Notice Tab */}
        {activeTab === "notice" && (
          <div className="mt-6">
            <h2 className="mb-4 text-lg font-black">Manage Notice/Advertisement</h2>
            <div className="rounded-xl border-2 border-border bg-card p-6">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs font-bold text-muted-foreground">Type</label>
                  <select
                    value={noticeForm.type}
                    onChange={(e) => setNoticeForm({ ...noticeForm, type: e.target.value })}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                  >
                    <option value="NOTICE">Notice</option>
                    <option value="ADVERTISEMENT">Advertisement</option>
                    <option value="UPDATE">Updates</option>
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-bold text-muted-foreground">Status</label>
                  <div className="flex items-center gap-2 pt-2">
                    <span className={`inline-block h-3 w-3 rounded-full ${noticeForm.is_active ? "bg-green-500" : "bg-neutral-300"}`} />
                    <span className="text-sm font-semibold">{noticeForm.is_active ? "Active" : "Inactive"}</span>
                  </div>
                </div>
                <div className="sm:col-span-2">
                  <label className="mb-1 block text-xs font-bold text-muted-foreground">Headline</label>
                  <input
                    type="text"
                    value={noticeForm.headline}
                    onChange={(e) => setNoticeForm({ ...noticeForm, headline: e.target.value })}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                    placeholder="E.g. Download our app"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="mb-1 block text-xs font-bold text-muted-foreground">Body</label>
                  <textarea
                    value={noticeForm.body}
                    onChange={(e) => setNoticeForm({ ...noticeForm, body: e.target.value })}
                    rows={3}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                    placeholder="Short description..."
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-bold text-muted-foreground">URL (optional)</label>
                  <input
                    type="url"
                    value={noticeForm.url}
                    onChange={(e) => setNoticeForm({ ...noticeForm, url: e.target.value })}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                    placeholder="https://..."
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-bold text-muted-foreground">URL Text (optional)</label>
                  <input
                    type="text"
                    value={noticeForm.url_text}
                    onChange={(e) => setNoticeForm({ ...noticeForm, url_text: e.target.value })}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                    placeholder="Click here"
                  />
                </div>
              </div>

              <div className="mt-6 flex gap-3">
                <button
                  onClick={handleSaveNotice}
                  disabled={savingNotice || !noticeForm.headline}
                  className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-orange-500 px-4 py-2 text-sm font-bold text-white hover:bg-orange-600 disabled:opacity-50"
                >
                  <Save className="h-4 w-4" />
                  {savingNotice ? "Saving..." : "Save Notice"}
                </button>
                {noticeForm.id && noticeForm.is_active && (
                  <button
                    onClick={handleDeactivateNotice}
                    disabled={savingNotice}
                    className="flex items-center justify-center gap-2 rounded-lg bg-red-100 px-4 py-2 text-sm font-bold text-red-700 hover:bg-red-200 disabled:opacity-50"
                  >
                    <XCircle className="h-4 w-4" />
                    Deactivate
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
