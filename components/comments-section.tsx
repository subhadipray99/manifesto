"use client"

import { useState, useEffect, useCallback } from "react"
import { useClerk } from "@clerk/nextjs"
import { ArrowBigUp, ArrowBigDown, MessageSquare, Trash2, LogIn } from "lucide-react"

type CommentType = {
  id: string
  promise_id: string
  state_id: string
  parent_id: string | null
  body: string
  user_id: string
  username?: string | null
  author_name: string
  image_url?: string | null
  upvotes: number
  downvotes: number
  score: number
  userVote: number
  created_at: string
}

const AVATAR_COLORS = ["bg-orange-500", "bg-blue-500", "bg-green-500", "bg-purple-500", "bg-pink-500", "bg-red-500"]

function timeAgo(timestamp: string) {
  const diff = Date.now() - new Date(timestamp).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return "just now"
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 30) return `${days}d ago`
  return new Date(timestamp).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })
}

// Build a nested tree from a flat list of comments
function buildTree(comments: CommentType[]) {
  const map = new Map<string, CommentType & { children: any[] }>()
  const roots: (CommentType & { children: any[] })[] = []
  comments.forEach((c) => map.set(c.id, { ...c, children: [] }))
  comments.forEach((c) => {
    const node = map.get(c.id)!
    if (c.parent_id && map.has(c.parent_id)) {
      map.get(c.parent_id)!.children.push(node)
    } else {
      roots.push(node)
    }
  })
  return roots
}

function CommentNode({
  node,
  depth,
  isSignedIn,
  isAdmin,
  onReply,
  onVote,
  onDelete,
  replyingTo,
  setReplyingTo,
}: {
  node: CommentType & { children: any[] }
  depth: number
  isSignedIn: boolean
  isAdmin: boolean
  onReply: (parentId: string, body: string) => Promise<void>
  onVote: (commentId: string, vote: number) => void
  onDelete: (commentId: string) => void
  replyingTo: string | null
  setReplyingTo: (id: string | null) => void
}) {
  const { openSignIn } = useClerk()
  const [replyText, setReplyText] = useState("")
  const [submitting, setSubmitting] = useState(false)

  const colorIndex = node.author_name.charCodeAt(0) % AVATAR_COLORS.length
  const initials = node.author_name[0]?.toUpperCase() || "?"
  const profileHref = `/profile/${node.username || node.user_id}`
  const isReplying = replyingTo === node.id
  const hasAvatar = Boolean(node.image_url)

  const handleReplySubmit = async () => {
    if (!replyText.trim()) return
    setSubmitting(true)
    try {
      await onReply(node.id, replyText.trim())
      setReplyText("")
      setReplyingTo(null)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className={depth > 0 ? "border-l-2 border-border pl-3 sm:pl-4" : ""}>
      <div className="rounded-xl border-2 border-border bg-card p-3">
        <div className="flex items-start gap-2.5">
          <a
            href={profileHref}
            className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full overflow-hidden shadow-sm transition-opacity hover:opacity-80 ${hasAvatar ? "" : `${AVATAR_COLORS[colorIndex]} text-xs font-bold text-white`}`}
          >
            {hasAvatar ? (
              <img
                src={node.image_url!}
                alt={node.author_name}
                className="h-8 w-8 rounded-full object-cover"
                referrerPolicy="no-referrer"
              />
            ) : (
              initials
            )}
          </a>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <a href={profileHref} className="text-sm font-bold text-foreground hover:text-orange-600 hover:underline">
                {node.author_name}
              </a>
              <span className="text-xs text-muted-foreground">{timeAgo(node.created_at)}</span>
            </div>
            <p className="mt-1 whitespace-pre-wrap break-words text-sm leading-relaxed text-foreground">{node.body}</p>

            <div className="mt-2 flex items-center gap-1">
              {/* Vote controls */}
              <div className="flex items-center gap-0.5 rounded-full border border-border bg-muted/40 px-1 py-0.5">
                <button
                  onClick={() => (isSignedIn ? onVote(node.id, 1) : openSignIn())}
                  className={`flex h-6 w-6 items-center justify-center rounded-full transition-colors ${node.userVote === 1 ? "text-orange-600" : "text-muted-foreground hover:text-foreground"}`}
                  aria-label="Upvote"
                >
                  <ArrowBigUp className={`h-4 w-4 ${node.userVote === 1 ? "fill-orange-600" : ""}`} />
                </button>
                <span className={`min-w-[1.25rem] text-center text-xs font-bold ${node.score > 0 ? "text-orange-600" : node.score < 0 ? "text-blue-600" : "text-muted-foreground"}`}>
                  {node.score}
                </span>
                <button
                  onClick={() => (isSignedIn ? onVote(node.id, -1) : openSignIn())}
                  className={`flex h-6 w-6 items-center justify-center rounded-full transition-colors ${node.userVote === -1 ? "text-blue-600" : "text-muted-foreground hover:text-foreground"}`}
                  aria-label="Downvote"
                >
                  <ArrowBigDown className={`h-4 w-4 ${node.userVote === -1 ? "fill-blue-600" : ""}`} />
                </button>
              </div>

              <button
                onClick={() => (isSignedIn ? setReplyingTo(isReplying ? null : node.id) : openSignIn())}
                className="flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                <MessageSquare className="h-3.5 w-3.5" />
                Reply
              </button>

              {isAdmin && (
                <button
                  onClick={() => onDelete(node.id)}
                  className="flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium text-red-500 transition-colors hover:bg-red-50"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Delete
                </button>
              )}
            </div>

            {isReplying && (
              <div className="mt-3">
                <textarea
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder={`Reply to ${node.author_name}...`}
                  rows={2}
                  maxLength={2000}
                  className="w-full resize-none rounded-lg border-2 border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/50 focus:border-orange-500 focus:outline-none"
                />
                <div className="mt-2 flex gap-2">
                  <button
                    onClick={() => { setReplyingTo(null); setReplyText("") }}
                    className="rounded-lg border-2 border-border px-3 py-1.5 text-xs font-bold text-muted-foreground transition-colors hover:bg-muted"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleReplySubmit}
                    disabled={submitting || !replyText.trim()}
                    className="rounded-lg bg-orange-600 px-3 py-1.5 text-xs font-bold text-white transition-colors disabled:opacity-50"
                  >
                    {submitting ? "Posting..." : "Post Reply"}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {node.children.length > 0 && (
        <div className="mt-2 space-y-2">
          {node.children.map((child: any) => (
            <CommentNode
              key={child.id}
              node={child}
              depth={depth + 1}
              isSignedIn={isSignedIn}
              isAdmin={isAdmin}
              onReply={onReply}
              onVote={onVote}
              onDelete={onDelete}
              replyingTo={replyingTo}
              setReplyingTo={setReplyingTo}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export function CommentsSection({
  promiseId,
  stateId,
  isSignedIn,
  isAdmin,
  highlightCommentId,
}: {
  promiseId: string
  stateId: string
  isSignedIn: boolean
  isAdmin: boolean
  highlightCommentId?: string | null
}) {
  const { openSignIn } = useClerk()
  const [comments, setComments] = useState<CommentType[]>([])
  const [loading, setLoading] = useState(true)
  const [newComment, setNewComment] = useState("")
  const [posting, setPosting] = useState(false)
  const [replyingTo, setReplyingTo] = useState<string | null>(null)

  const loadComments = useCallback(async () => {
    try {
      const res = await fetch(`/api/promises/comments?promiseId=${promiseId}&stateId=${stateId}`)
      const data = await res.json()
      setComments(data.comments || [])
    } catch (e) {
      console.error("[v0] Failed to load comments", e)
    } finally {
      setLoading(false)
    }
  }, [promiseId, stateId])

  useEffect(() => {
    loadComments()
  }, [loadComments])

  // Scroll to and flash-highlight the deep-linked comment once loaded
  useEffect(() => {
    if (!highlightCommentId || loading) return
    const el = document.getElementById(`comment-${highlightCommentId}`)
    if (!el) return
    setTimeout(() => {
      el.scrollIntoView({ behavior: "smooth", block: "center" })
      el.classList.add("ring-2", "ring-orange-400", "ring-offset-2")
      setTimeout(() => el.classList.remove("ring-2", "ring-orange-400", "ring-offset-2"), 2500)
    }, 150)
  }, [highlightCommentId, loading])

  const postComment = async (body: string, parentId: string | null) => {
    const res = await fetch("/api/promises/comments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ promiseId, stateId, body, parentId }),
    })
    if (res.ok) {
      const data = await res.json()
      setComments((prev) => [...prev, data.comment])
    }
  }

  const handleTopLevelSubmit = async () => {
    if (!newComment.trim()) return
    setPosting(true)
    try {
      await postComment(newComment.trim(), null)
      setNewComment("")
    } finally {
      setPosting(false)
    }
  }

  const handleVote = async (commentId: string, vote: number) => {
    // optimistic-ish: send and reconcile from server response
    const res = await fetch("/api/promises/comments/vote", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ commentId, vote }),
    })
    if (res.ok) {
      const data = await res.json()
      setComments((prev) =>
        prev.map((c) =>
          c.id === commentId
            ? { ...c, upvotes: data.upvotes, downvotes: data.downvotes, score: data.score, userVote: data.userVote }
            : c,
        ),
      )
    }
  }

  const handleDelete = async (commentId: string) => {
    const res = await fetch(`/api/promises/comments?commentId=${commentId}`, { method: "DELETE" })
    if (res.ok) {
      // Remove the comment and any descendants
      const toRemove = new Set<string>([commentId])
      let changed = true
      while (changed) {
        changed = false
        comments.forEach((c) => {
          if (c.parent_id && toRemove.has(c.parent_id) && !toRemove.has(c.id)) {
            toRemove.add(c.id)
            changed = true
          }
        })
      }
      setComments((prev) => prev.filter((c) => !toRemove.has(c.id)))
    }
  }

  const tree = buildTree(comments)

  return (
    <div className="px-4 py-4 sm:px-6 sm:py-5">
      {/* New comment composer */}
      {isSignedIn ? (
        <div className="rounded-xl border-2 border-border bg-card p-3 transition-shadow">
          <textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Share your thoughts on this promise..."
            rows={3}
            maxLength={2000}
            className="w-full resize-none rounded-lg border-2 border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/50 focus:border-orange-500 focus:outline-none"
          />
          <div className="mt-2 flex items-center justify-between">
            <span className="text-xs text-muted-foreground">{newComment.length}/2000</span>
            <button
              onClick={handleTopLevelSubmit}
              disabled={posting || !newComment.trim()}
              className="rounded-full bg-gradient-to-r from-orange-600 to-orange-500 px-4 py-1.5 text-sm font-bold text-white transition-colors disabled:opacity-50"
            >
              {posting ? "Posting..." : "Post Comment"}
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => openSignIn()}
          className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border bg-muted/50 px-4 py-4 text-sm font-bold text-blue-600 transition-colors hover:bg-muted"
        >
          <LogIn className="h-4 w-4" />
          Sign in to join the discussion
        </button>
      )}

      {/* Comments list */}
      <div className="mt-4">
        {loading ? (
          <div className="py-8 text-center text-sm text-muted-foreground">Loading comments...</div>
        ) : tree.length > 0 ? (
          <div className="space-y-3">
            {tree.map((node) => (
              <CommentNode
                key={node.id}
                node={node}
                depth={0}
                isSignedIn={isSignedIn}
                isAdmin={isAdmin}
                onReply={(parentId, body) => postComment(body, parentId)}
                onVote={handleVote}
                onDelete={handleDelete}
                replyingTo={replyingTo}
                setReplyingTo={setReplyingTo}
              />
            ))}
          </div>
        ) : (
          <div className="rounded-xl border-2 border-dashed border-border bg-muted/50 p-6 text-center">
            <p className="text-sm text-muted-foreground">No comments yet. Start the conversation!</p>
          </div>
        )}
      </div>
    </div>
  )
}
