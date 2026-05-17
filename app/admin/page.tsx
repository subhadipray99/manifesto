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

type AdminTab = "submissions" | "states" | "categories" | "promises"

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
                            <h3 className="text-base font-black text-foreground sm:text-lg">{update.title}</h3>
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
      </div>
    </div>
  )
}
