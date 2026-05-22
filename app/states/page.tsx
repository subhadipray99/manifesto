import Link from "next/link"
import { STATES } from "@/lib/states"
import { MapPin, ChevronRight } from "lucide-react"

export const metadata = {
  title: "All States | The Manifesto",
  description: "Track election manifesto promises across all Indian states with The Manifesto.",
}

export default function StatesIndexPage() {
  const states = Object.values(STATES)

  return (
    <div className="min-h-dvh bg-gradient-to-b from-orange-50/80 to-background">
      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-orange-500/20 bg-gradient-to-r from-orange-700 via-orange-600 to-orange-500 px-4 py-4 shadow-lg">
        <div className="mx-auto max-w-2xl">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-t-xl rounded-br-sm bg-white text-3xl font-black text-orange-600 shadow-md" style={{ fontFamily: '"Oswald", sans-serif', fontStyle: 'italic' }}>
              M
            </div>
            <div>
              <h1 className="font-serif text-2xl font-black leading-none tracking-tight text-white">
                THE MANIFESTO
              </h1>
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/70">
                All States
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="px-4 py-8">
        <div className="mx-auto max-w-2xl">
          <h2 className="text-xl font-black text-foreground">Select a State</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Choose a state to track its election manifesto promises.
          </p>

          <div className="mt-6 space-y-3">
            {states.map((state) => {
              const promiseCount = state.categories.reduce((acc, cat) => acc + cat.promises.length, 0)

              return (
                <Link
                  key={state.id}
                  href={`/${state.id}`}
                  className="group flex items-center justify-between rounded-2xl border border-border bg-white p-4 shadow-sm transition-all duration-200 hover:border-orange-300 hover:shadow-md hover:-translate-y-0.5 active:scale-[0.98]"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-orange-100 to-orange-50 text-orange-600 transition-colors group-hover:from-orange-200 group-hover:to-orange-100">
                      <MapPin className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-foreground">{state.name}</h3>
                      <p className="text-xs text-muted-foreground">
                        {state.party} • {promiseCount} promises • {state.categories.length} categories
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="h-5 w-5 text-muted-foreground transition-transform group-hover:translate-x-1 group-hover:text-orange-600" />
                </Link>
              )
            })}
          </div>

          {states.length === 1 && (
            <div className="mt-8 rounded-2xl border border-dashed border-orange-300 bg-gradient-to-b from-orange-50/80 to-orange-50/30 p-6 text-center">
              <p className="text-sm font-medium text-orange-700">More states coming soon!</p>
              <p className="mt-1 text-xs text-orange-600/80">
                We are actively adding more state manifestos. Stay tuned.
              </p>
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border bg-muted/30 px-4 py-6">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-xs text-muted-foreground">
            The Manifesto - Citizen-powered accountability across India
          </p>
        </div>
      </footer>
    </div>
  )
}
