"use client"

import { X, Keyboard } from "lucide-react"
import { useEffect } from "react"

interface ShortcutsModalProps {
  onClose: () => void
}

const SHORTCUTS = [
  { keys: ["/"], description: "Focus search" },
  { keys: ["Escape"], description: "Close modal / clear search" },
  { keys: ["S"], description: "Share page" },
  { keys: ["T"], description: "Top contributors" },
  { keys: ["?"], description: "Show this help" },
]

export function ShortcutsModal({ onClose }: ShortcutsModalProps) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
    }
    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  }, [onClose])

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm rounded-2xl border border-border bg-card shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <div className="flex items-center gap-2">
            <Keyboard className="h-4 w-4 text-orange-500" />
            <h2 className="text-sm font-bold text-foreground">Keyboard Shortcuts</h2>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Shortcut list */}
        <ul className="divide-y divide-border px-2 py-2">
          {SHORTCUTS.map((shortcut) => (
            <li key={shortcut.keys.join("+")} className="flex items-center justify-between px-3 py-2.5">
              <span className="text-sm text-muted-foreground">{shortcut.description}</span>
              <div className="flex items-center gap-1">
                {shortcut.keys.map((k) => (
                  <kbd
                    key={k}
                    className="inline-flex min-w-[1.75rem] items-center justify-center rounded-md border border-border bg-muted px-1.5 py-0.5 font-mono text-xs font-semibold text-foreground shadow-sm"
                  >
                    {k}
                  </kbd>
                ))}
              </div>
            </li>
          ))}
        </ul>

        {/* Footer hint */}
        <div className="border-t border-border px-5 py-3">
          <p className="text-center text-xs text-muted-foreground">
            Shortcuts are disabled while typing in inputs
          </p>
        </div>
      </div>
    </div>
  )
}
