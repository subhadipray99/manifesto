import { Metadata } from "next"
import Link from "next/link"
import { CheckCircle, Users, Lightbulb, Shield } from "lucide-react"

export const metadata: Metadata = {
  title: "About The Manifesto | Promise Tracker",
  description:
    "Learn about The Manifesto project - a citizen-powered accountability platform for tracking political promises and holding governments accountable.",
  openGraph: {
    title: "About The Manifesto | Promise Tracker",
    description:
      "Learn about The Manifesto project - a citizen-powered accountability platform for tracking political promises.",
    type: "website",
  },
}

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-background">
      {/* Header */}
      <section className="border-b-4 border-green-600 bg-orange-600 px-4 py-12 sm:py-16">
        <div className="mx-auto max-w-3xl text-center">
          <h1 className="font-serif text-4xl font-black text-white sm:text-5xl">
            About The Manifesto
          </h1>
          <p className="mt-4 text-lg text-white/90">
            Citizen-powered accountability for political promises
          </p>
        </div>
      </section>

      {/* Main Content */}
      <div className="mx-auto max-w-4xl px-4 py-12 sm:py-16">
        {/* Mission Section */}
        <section className="mb-16">
          <h2 className="font-serif text-3xl font-black text-foreground mb-6">
            Our Mission
          </h2>
          <p className="text-lg leading-relaxed text-muted-foreground mb-4">
            The Manifesto is a citizen-powered platform designed to track and monitor political promises made during elections. We believe in transparency, accountability, and the power of informed citizens to hold their leaders responsible.
          </p>
          <p className="text-lg leading-relaxed text-muted-foreground">
            By documenting promises and tracking their fulfillment in real-time, we create a living record of government performance. This enables citizens to make informed decisions and demand accountability from elected officials.
          </p>
        </section>

        {/* Core Values */}
        <section className="mb-16">
          <h2 className="font-serif text-3xl font-black text-foreground mb-8">
            Our Core Values
          </h2>
          <div className="grid gap-6 md:grid-cols-2">
            {[
              {
                icon: CheckCircle,
                title: "Transparency",
                description:
                  "All data is publicly available and independently verifiable. We hide nothing and welcome scrutiny.",
              },
              {
                icon: Shield,
                title: "Independence",
                description:
                  "We operate independently without political affiliation. Our only allegiance is to the truth.",
              },
              {
                icon: Users,
                title: "Citizen Power",
                description:
                  "Citizens drive the platform through contributions and verification. Your voice matters.",
              },
              {
                icon: Lightbulb,
                title: "Accountability",
                description:
                  "Leaders are judged by their actions, not their words. Every promise is tracked and verified.",
              },
            ].map((value, idx) => {
              const Icon = value.icon
              return (
                <div
                  key={idx}
                  className="rounded-xl border border-border bg-card p-6 hover:border-orange-300 hover:shadow-lg transition-all"
                >
                  <div className="flex items-start gap-4">
                    <Icon className="h-8 w-8 flex-shrink-0 text-orange-600 mt-1" />
                    <div>
                      <h3 className="font-serif text-xl font-black text-foreground mb-2">
                        {value.title}
                      </h3>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {value.description}
                      </p>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </section>

        {/* How It Works */}
        <section className="mb-16">
          <h2 className="font-serif text-3xl font-black text-foreground mb-8">
            How It Works
          </h2>
          <div className="space-y-6">
            {[
              {
                num: 1,
                title: "Promises Documented",
                description:
                  "Election manifestos are broken down into specific, trackable promises across different categories.",
              },
              {
                num: 2,
                title: "Community Contributions",
                description:
                  "Citizens submit evidence and updates on promise fulfillment. Each submission is reviewed for accuracy.",
              },
              {
                num: 3,
                title: "Real-time Tracking",
                description:
                  "The platform shows real-time progress with detailed categorization and status updates.",
              },
              {
                num: 4,
                title: "Accountability",
                description:
                  "Government performance is measured transparently. Citizens can demand answers for unfulfilled promises.",
              },
            ].map((step, idx) => (
              <div key={idx} className="flex gap-6 pb-6 border-b border-border last:border-b-0 last:pb-0">
                <div className="flex-shrink-0">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-orange-100 text-lg font-black text-orange-600">
                    {step.num}
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-serif text-xl font-black text-foreground mb-2">
                    {step.title}
                  </h3>
                  <p className="text-muted-foreground leading-relaxed">
                    {step.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Get Involved */}
        <section className="rounded-xl border-4 border-orange-600 bg-orange-50 p-8 text-center">
          <h2 className="font-serif text-2xl font-black text-foreground mb-4">
            Help Us Track Promises
          </h2>
          <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
            Every citizen can contribute to holding leaders accountable. Submit verified updates, corrections, and evidence to help build the most comprehensive promise tracker.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/"
              className="rounded-lg bg-orange-600 px-8 py-3 font-bold text-white hover:bg-orange-700 transition-colors text-center"
            >
              Start Tracking
            </Link>
            <Link
              href="/privacy"
              className="rounded-lg border-2 border-orange-600 px-8 py-3 font-bold text-orange-600 hover:bg-orange-100 transition-colors text-center"
            >
              Learn More
            </Link>
          </div>
        </section>

        {/* Contact */}
        <section className="mt-16 border-t border-border pt-12">
          <h2 className="font-serif text-3xl font-black text-foreground mb-6">
            Questions?
          </h2>
          <p className="text-lg text-muted-foreground mb-6">
            For inquiries, suggestions, or support, please reach out to us:
          </p>
          <a
            href="mailto:toddwake666@gmail.com"
            className="inline-flex items-center gap-2 rounded-lg bg-orange-100 px-6 py-3 font-bold text-orange-600 hover:bg-orange-200 transition-colors"
          >
            Contact Us
          </a>
        </section>
      </div>

      {/* Footer */}
      <footer className="border-t border-border bg-card mt-16 px-4 py-8">
        <div className="mx-auto max-w-4xl text-center">
          <p className="text-sm text-muted-foreground">
            The Manifesto © 2026 • Citizen-powered accountability for promises
          </p>
          <div className="mt-4 flex justify-center gap-6">
            <Link href="/privacy" className="text-sm text-orange-600 hover:text-orange-700">
              Privacy Policy
            </Link>
            <Link href="/" className="text-sm text-orange-600 hover:text-orange-700">
              Home
            </Link>
          </div>
        </div>
      </footer>
    </main>
  )
}
