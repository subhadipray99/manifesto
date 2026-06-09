import type { Metadata, Viewport } from "next"
import { Inter, Playfair_Display } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import { ClerkProvider } from "@clerk/nextjs"
import "./globals.css"

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
})

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-serif",
  display: "swap",
})

export const metadata: Metadata = {
  metadataBase: new URL("https://manifesto.page"),
  title: "BJP Promise Tracker | Track BJP Manifesto Promises & Fulfillment",
  description:
    "BJP Promise Tracker — monitor every BJP manifesto promise and its fulfillment in real time. Track election commitments across governance, employment, and infrastructure with citizen-powered accountability.",
  generator: "v0.app",
  keywords: [
    "BJP promise tracker",
    "BJP manifesto tracker",
    "BJP promises tracker",
    "BJP manifesto promises",
    "BJP promise fulfillment",
    "track BJP promises",
    "BJP West Bengal promise tracker",
    "BJP election manifesto tracker",
    "BJP accountability tracker",
    "political promise tracker India",
  ],
  authors: [{ name: "ObserverFiles", url: "https://observerfile.com" }],
  referrer: "strict-origin-when-cross-origin",
  formatDetection: {
    email: false,
    telephone: false,
    address: false,
  },
  manifest: "/manifest.json",
  icons: {
    icon: "/favicon.jpg",
    apple: "/apple-icon.png",
  },
  openGraph: {
    title: "BJP Promise Tracker — Track Every BJP Manifesto Promise",
    description: "Monitor BJP manifesto promises and their fulfillment in real time. Track election commitments across governance, employment, infrastructure, and more with citizen-powered accountability.",
    url: "https://manifesto.page",
    siteName: "The Manifesto",
    locale: "en_IN",
    type: "website",
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "BJP Promise Tracker - The Manifesto",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "BJP Promise Tracker — Track BJP Manifesto Promises",
    description: "Monitor BJP manifesto promises and fulfillment in real time. Citizen-powered accountability platform tracking election commitments.",
    images: ["/og-image.jpg"],
    creator: "@observerfiles",
  },
  robots: {
    index: true,
    follow: true,
    nocache: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  alternates: {
    canonical: "https://manifesto.page",
  },
}

export const viewport: Viewport = {
  themeColor: "#FF9933",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const organizationSchema = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": "https://manifesto.page/#organization",
        name: "The Manifesto",
        url: "https://manifesto.page",
        logo: "https://manifesto.page/manifesto-logo.png",
        description: "Citizen-powered accountability platform tracking BJP manifesto promises and their fulfillment.",
        sameAs: ["https://x.com/ManifestoPage"],
        contactPoint: {
          "@type": "ContactPoint",
          email: "toddwake666@gmail.com",
          contactType: "customer support",
        },
      },
      {
        "@type": "WebSite",
        "@id": "https://manifesto.page/#website",
        url: "https://manifesto.page",
        name: "BJP Promise Tracker",
        description: "Track every BJP manifesto promise and its fulfillment in real time.",
        publisher: { "@id": "https://manifesto.page/#organization" },
        potentialAction: {
          "@type": "SearchAction",
          target: {
            "@type": "EntryPoint",
            urlTemplate: "https://manifesto.page/?q={search_term_string}",
          },
          "query-input": "required name=search_term_string",
        },
      },
      {
        "@type": "FAQPage",
        "@id": "https://manifesto.page/#faq",
        mainEntity: [
          {
            "@type": "Question",
            name: "What is the BJP Promise Tracker?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "The BJP Promise Tracker is a citizen-powered accountability platform that monitors every BJP manifesto promise and tracks whether it has been fulfilled, is in progress, or is broken — across categories like governance, employment, and infrastructure.",
            },
          },
          {
            "@type": "Question",
            name: "How are BJP promises tracked and scored?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "Each promise is rated as Fulfilled (1 point), In Progress (0.5 points), Broken (0 points), or Not Rated. The overall score is calculated as (Fulfilled + In Progress × 0.5) divided by total promises, giving a transparent fulfillment percentage.",
            },
          },
          {
            "@type": "Question",
            name: "Is the BJP Promise Tracker free to use?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "Yes. The BJP Promise Tracker is a free, citizen-powered platform. Anyone can view promise progress, and signed-in users can submit verified updates.",
            },
          },
        ],
      },
    ],
  }

  return (
    <html lang="en" className={`${inter.variable} ${playfair.variable} bg-background`}>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
        />
      </head>
      <body className="font-sans antialiased">
        <ClerkProvider>
          {children}
          {process.env.NODE_ENV === "production" && <Analytics />}
        </ClerkProvider>
      </body>
    </html>
  )
}
