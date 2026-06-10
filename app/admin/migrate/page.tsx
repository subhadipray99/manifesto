"use client"

import { useState } from "react"
import { Loader2, CheckCircle2, AlertCircle, Copy } from "lucide-react"

export default function MigrationPage() {
  const [secret, setSecret] = useState("")
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState("")
  const [copied, setCopied] = useState(false)

  const runMigration = async () => {
    if (!secret.trim()) {
      setError("Please enter the admin secret")
      return
    }

    setLoading(true)
    setError("")
    setResult(null)

    try {
      const res = await fetch("/api/admin/migrate-usernames", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${secret.trim()}`,
          "Content-Type": "application/json",
        },
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || "Migration failed")
      } else {
        setResult(data)
        setSecret("")
      }
    } catch (err: any) {
      setError(err.message || "Something went wrong")
    } finally {
      setLoading(false)
    }
  }

  const copyCommand = () => {
    navigator.clipboard.writeText(
      `curl -X POST https://${typeof window !== "undefined" ? window.location.hostname : "your-domain.vercel.app"}/api/admin/migrate-usernames \\
  -H "Authorization: Bearer d30f8a4acc6fcdaa0c913bd9d7977283"`
    )
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-6">
      <div className="mx-auto max-w-2xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-black text-white">Admin: Migrate Usernames</h1>
          <p className="mt-2 text-sm text-slate-400">
            Bulk-update existing auto-generated usernames from Clerk&apos;s data
          </p>
        </div>

        {/* Card */}
        <div className="rounded-2xl border-2 border-slate-700 bg-slate-900/50 p-6 backdrop-blur">
          {/* Secret Input */}
          <div className="mb-6">
            <label className="block text-sm font-bold text-white mb-2">Admin Migration Secret</label>
            <input
              type="password"
              value={secret}
              onChange={(e) => setSecret(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && runMigration()}
              placeholder="Paste your ADMIN_MIGRATION_SECRET here"
              disabled={loading}
              className="w-full rounded-lg border-2 border-slate-600 bg-slate-800 px-4 py-2.5 text-white placeholder:text-slate-500 focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500 disabled:opacity-50"
            />
            <p className="mt-1 text-xs text-slate-400">
              Enter the secret you saved in your project Vars (ADMIN_MIGRATION_SECRET)
            </p>
          </div>

          {/* Run Button */}
          <button
            onClick={runMigration}
            disabled={loading || !secret.trim()}
            className="w-full flex items-center justify-center gap-2 rounded-lg bg-orange-600 px-4 py-2.5 font-bold text-white transition-all hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed active:scale-95"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Running Migration...
              </>
            ) : (
              "Run Migration"
            )}
          </button>

          {/* Success Result */}
          {result && !error && (
            <div className="mt-6 rounded-lg border-2 border-green-600/50 bg-green-950/30 p-4">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 flex-shrink-0 text-green-500 mt-0.5" />
                <div className="flex-1">
                  <p className="font-bold text-green-400">Migration completed!</p>
                  <div className="mt-2 space-y-1 text-sm text-green-300/80 font-mono">
                    <p>✓ Updated: {result.updated}</p>
                    <p>✓ Skipped: {result.skipped}</p>
                    <p>✓ Failed: {result.failed}</p>
                  </div>
                  {result.details && result.details.length > 0 && (
                    <div className="mt-3 rounded bg-slate-800 p-2 text-xs text-slate-300 max-h-48 overflow-y-auto">
                      {result.details.map((d: string, i: number) => (
                        <p key={i}>{d}</p>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="mt-6 rounded-lg border-2 border-red-600/50 bg-red-950/30 p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 flex-shrink-0 text-red-500 mt-0.5" />
                <div>
                  <p className="font-bold text-red-400">Error</p>
                  <p className="mt-1 text-sm text-red-300/80">{error}</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Info */}
        <div className="mt-8 rounded-lg border-2 border-slate-700 bg-slate-900/50 p-4">
          <p className="text-xs font-bold text-slate-300 uppercase tracking-wide mb-3">What this does</p>
          <ul className="space-y-2 text-sm text-slate-400">
            <li>• Fetches all users from Clerk</li>
            <li>• For each user with a username set, checks our DB</li>
            <li>• If the user&apos;s row has is_custom=FALSE (auto-generated), updates it to use Clerk&apos;s username</li>
            <li>• Returns a report of updated, skipped, and failed records</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
