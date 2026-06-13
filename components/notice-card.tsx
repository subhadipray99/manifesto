"use client"

import { useEffect, useState } from "react"
import { ChevronDown, ChevronUp, ExternalLink, Megaphone, Target } from "lucide-react"

type Notice = {
  id: string
  type: string
  headline: string
  body?: string
  url?: string
  url_text?: string
}

export function NoticeCard() {
  const [notice, setNotice] = useState<Notice | null>(null)
  const [loading, setLoading] = useState(true)
  const [isExpanded, setIsExpanded] = useState(true)

  useEffect(() => {
    async function fetchNotice() {
      try {
        const res = await fetch("/api/notice")
        if (!res.ok) return
        const data = await res.json()
        setNotice(data.notice)
      } catch (error) {
        console.error("Error fetching notice:", error)
      } finally {
        setLoading(false)
      }
    }
    fetchNotice()
  }, [])

  if (loading || !notice) return null

  const isAd = notice.type === "ADVERTISEMENT"

  return (
    <div className="mb-6 overflow-hidden rounded-xl border border-border bg-card shadow-sm transition-all duration-300">
      {/* Header section (Always visible) */}
      <div 
        className={`flex cursor-pointer items-start justify-between p-4 ${isExpanded ? "border-b border-border bg-muted/20" : ""}`}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex-1 pr-4">
          <div className="mb-2 flex items-center gap-2">
            <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
              isAd 
                ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" 
                : "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
            }`}>
              {isAd ? <Target className="h-3 w-3" /> : <Megaphone className="h-3 w-3" />}
              {isAd ? "Advertisement" : "Notice"}
            </span>
          </div>
          <h3 className="font-bold text-foreground leading-tight">{notice.headline}</h3>
        </div>
        <button 
          className="mt-1 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground transition-colors hover:bg-muted/80 hover:text-foreground"
          aria-label={isExpanded ? "Collapse notice" : "Expand notice"}
        >
          {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </button>
      </div>

      {/* Expandable Body */}
      {isExpanded && (notice.body || notice.url) && (
        <div className="p-4 animate-in slide-in-from-top-2 fade-in duration-200">
          {notice.body && (
            <p className="whitespace-pre-wrap text-sm text-muted-foreground leading-relaxed">
              {notice.body}
            </p>
          )}
          
          {notice.url && (
            <a 
              href={notice.url} 
              target="_blank" 
              rel="noopener noreferrer"
              className={`mt-4 flex w-full items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-bold text-white transition-opacity hover:opacity-90 ${
                isAd ? "bg-red-600" : "bg-green-600"
              }`}
            >
              {notice.url_text || "Learn More"}
              <ExternalLink className="h-4 w-4" />
            </a>
          )}
        </div>
      )}
    </div>
  )
}
