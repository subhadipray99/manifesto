"use client"

import { useState } from "react"
import { X, Copy, Check } from "lucide-react"

export function DonationModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [copied, setCopied] = useState(false)

  const UPI_ID = "manifesto1@ptyes"
  const UPI_LINK = `upi://pay?pa=${UPI_ID}`

  const copyUPI = () => {
    navigator.clipboard.writeText(UPI_ID)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 sm:items-center sm:p-4">
      <div className="w-full rounded-t-3xl bg-card sm:rounded-2xl sm:max-w-md shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-4 py-4 sm:px-6 sm:py-5">
          <h2 className="font-serif text-lg font-black text-foreground">Support The Manifesto</h2>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-muted transition-colors"
            aria-label="Close"
          >
            <X className="h-5 w-5 text-muted-foreground" />
          </button>
        </div>

        {/* Body */}
        <div className="space-y-6 px-4 py-6 sm:px-6">
          {/* QR Code */}
          <div className="flex justify-center">
            <div className="rounded-xl border-2 border-border bg-white p-4">
              <img 
                src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/receive_money_image-NL7NG5OvtXPdA3Ei5XUwfEGPHLe40K.png" 
                alt="UPI QR Code" 
                className="h-56 w-56"
              />
            </div>
          </div>

          {/* Scan text */}
          <div className="text-center">
            <p className="font-serif text-base font-black text-foreground mb-1">Scan QR to pay</p>
            <p className="text-sm text-muted-foreground">Use any UPI app to scan and donate instantly</p>
          </div>

          {/* UPI ID */}
          <div className="rounded-lg border border-border bg-muted/30 p-4">
            <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground mb-2">UPI ID</p>
            <div className="flex items-center justify-between gap-2">
              <code className="flex-1 font-mono text-sm font-semibold text-foreground break-all">
                {UPI_ID}
              </code>
              <button
                onClick={copyUPI}
                className="flex items-center gap-1.5 rounded-lg bg-orange-500 px-2.5 py-1.5 text-xs font-bold text-white hover:bg-orange-600 transition-colors flex-shrink-0"
              >
                {copied ? (
                  <>
                    <Check className="h-3.5 w-3.5" />
                    <span>Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5" />
                    <span>Copy</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* CTA Button - Mobile only */}
          <a
            href={UPI_LINK}
            className="flex items-center justify-center md:hidden rounded-xl bg-gradient-to-r from-orange-600 to-orange-500 px-4 py-3 text-sm font-black text-white hover:opacity-90 transition-opacity active:scale-95"
          >
            Donate Now
          </a>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 rounded-xl border-2 border-border py-2.5 text-sm font-bold text-foreground hover:bg-muted transition-colors"
            >
              I&apos;ve donated
            </button>
            <button
              onClick={onClose}
              className="flex-shrink-0 flex h-10 w-10 items-center justify-center rounded-xl border-2 border-border hover:bg-muted transition-colors"
              aria-label="Close"
            >
              <X className="h-5 w-5 text-muted-foreground" />
            </button>
          </div>
        </div>

        {/* Footer note */}
        <div className="border-t border-border px-4 py-3 sm:px-6 text-center text-[11px] text-muted-foreground">
          <p>Every contribution helps us track promises and maintain transparency</p>
        </div>
      </div>
    </div>
  )
}
