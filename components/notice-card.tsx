"use client"

import { useEffect, useState } from "react"
import { ChevronDown, ChevronUp, ExternalLink, Megaphone, Target, Bell } from "lucide-react"

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
    <div className="mb-6 overflow-hidden rounded-xl border-4 border-slate-900 bg-white shadow-[8px_8px_0px_0px_rgba(15,23,42,1)] transition-all duration-300 hover:-translate-x-1 hover:-translate-y-1 hover:shadow-[12px_12px_0px_0px_rgba(15,23,42,1)] active:translate-x-0 active:translate-y-0 active:shadow-[4px_4px_0px_0px_rgba(15,23,42,1)] dark:border-slate-100 dark:bg-slate-900 dark:shadow-[8px_8px_0px_0px_rgba(255,255,255,0.9)] dark:hover:shadow-[12px_12px_0px_0px_rgba(255,255,255,0.9)] dark:active:shadow-[4px_4px_0px_0px_rgba(255,255,255,0.9)] transform-gpu -rotate-1">
      {/* Header section (Always visible) */}
      <div 
        className={`flex cursor-pointer items-start justify-between p-4 transition-colors ${
          isExpanded 
            ? "border-b-4 border-slate-900 bg-slate-100 dark:border-slate-100 dark:bg-slate-800" 
            : "hover:bg-slate-50 dark:hover:bg-slate-800/50"
        }`}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex-1 pr-4">
          <div className="mb-2 flex items-center gap-2">
            <span className={`inline-flex items-center gap-1 rounded-sm border-2 border-slate-900 px-2.5 py-0.5 text-[9px] font-black uppercase tracking-wider dark:border-slate-100 ${
              notice.type === "ADVERTISEMENT" 
                ? "bg-rose-400 text-slate-900" 
                : notice.type === "UPDATE"
                ? "bg-blue-500 text-white"
                : "bg-amber-400 text-slate-900"
            }`}>
              {notice.type === "ADVERTISEMENT" ? (
                <Target className={`h-3 w-3 ${notice.type === "UPDATE" ? "text-white" : "text-slate-900"}`} />
              ) : notice.type === "UPDATE" ? (
                <Bell className="h-3 w-3 text-white" />
              ) : (
                <Megaphone className="h-3 w-3 text-slate-900" />
              )}
              {notice.type === "ADVERTISEMENT" ? "Advertisement" : notice.type === "UPDATE" ? "Updates" : "Notice"}
            </span>
          </div>
          <h3 className="font-serif text-base font-black text-slate-900 leading-snug dark:text-slate-100">{notice.headline}</h3>
        </div>
        <button 
          className="mt-1 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-sm border-2 border-slate-900 bg-white text-slate-900 shadow-[2px_2px_0px_0px_rgba(15,23,42,1)] transition-all hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[3px_3px_0px_0px_rgba(15,23,42,1)] active:translate-x-0.5 active:translate-y-0.5 active:shadow-[1px_1px_0px_0px_rgba(15,23,42,1)] dark:border-slate-100 dark:bg-slate-800 dark:text-slate-100 dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,0.8)] dark:hover:shadow-[3px_3px_0px_0px_rgba(255,255,255,0.8)] dark:active:shadow-[1px_1px_0px_0px_rgba(255,255,255,0.8)]"
          aria-label={isExpanded ? "Collapse notice" : "Expand notice"}
        >
          {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </button>
      </div>

      {/* Expandable Body */}
      {isExpanded && (notice.body || notice.url) && (
        <div className="p-4 animate-in slide-in-from-top-2 fade-in duration-200 bg-white dark:bg-slate-900">
          {notice.body && (
            <p className="whitespace-pre-wrap text-sm font-medium text-slate-700 leading-relaxed dark:text-slate-300">
              {notice.body}
            </p>
          )}
          
          {notice.url && (
            <a 
              href={notice.url} 
              target="_blank" 
              rel="noopener noreferrer"
              className={`mt-4 flex w-full items-center justify-center gap-2 rounded-sm border-2 border-slate-900 py-2.5 text-sm font-black text-slate-900 transition-all hover:-translate-x-0.5 hover:-translate-y-0.5 active:translate-x-0.5 active:translate-y-0.5 dark:border-slate-100 dark:text-slate-900 ${
                notice.type === "ADVERTISEMENT" 
                  ? "bg-rose-400 shadow-[4px_4px_0px_0px_rgba(15,23,42,1)] hover:shadow-[5px_5px_0px_0px_rgba(15,23,42,1)] active:shadow-[1px_1px_0px_0px_rgba(15,23,42,1)] dark:bg-rose-400 dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,0.9)] dark:hover:shadow-[5px_5px_0px_0px_rgba(255,255,255,0.9)]" 
                  : notice.type === "UPDATE" 
                  ? "bg-blue-500 text-white shadow-[4px_4px_0px_0px_rgba(15,23,42,1)] hover:shadow-[5px_5px_0px_0px_rgba(15,23,42,1)] active:shadow-[1px_1px_0px_0px_rgba(15,23,42,1)] dark:bg-blue-500 dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,0.9)] dark:hover:shadow-[5px_5px_0px_0px_rgba(255,255,255,0.9)]" 
                  : "bg-amber-400 shadow-[4px_4px_0px_0px_rgba(15,23,42,1)] hover:shadow-[5px_5px_0px_0px_rgba(15,23,42,1)] active:shadow-[1px_1px_0px_0px_rgba(15,23,42,1)] dark:bg-amber-400 dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,0.9)] dark:hover:shadow-[5px_5px_0px_0px_rgba(255,255,255,0.9)]"
              }`}
            >
              {notice.url_text || "Learn More"}
              <ExternalLink className={`h-4 w-4 ${notice.type === "UPDATE" ? "text-white" : "text-slate-900"}`} />
            </a>
          )}
        </div>
      )}
    </div>
  )
}
