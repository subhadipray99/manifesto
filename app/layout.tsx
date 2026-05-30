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
  title: "BJP West Bengal Promise Tracker | West Bengal BJP Manifesto Accountability",
  description:
    "Track BJP West Bengal promises with real-time updates. Monitor promise fulfillment across categories like governance, employment, and infrastructure. Citizen-powered accountability for West Bengal elections.",
  generator: "v0.app",
  keywords: [
    "BJP West Bengal promise tracker",
    "West Bengal BJP manifesto tracker",
    "BJP promises West Bengal",
    "West Bengal election manifesto",
    "BJP promise fulfillment",
    "West Bengal governance promises",
    "BJP West Bengal accountability",
    "Promise tracker West Bengal",
    "Bengal elections 2026",
    "Election manifesto tracker India",
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
    title: "BJP West Bengal Promise Tracker - Monitor Manifesto Promises",
    description: "Track West Bengal BJP manifesto promises in real-time. Monitor fulfillment across governance, employment, infrastructure, and more. Citizen accountability platform for West Bengal elections.",
    url: "https://manifesto.page",
    siteName: "The Manifesto",
    locale: "en_IN",
    type: "website",
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "The Manifesto - BJP West Bengal Promise Tracker",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "BJP West Bengal Promise Tracker - Manifesto Accountability",
    description: "Monitor West Bengal BJP manifesto promises with real-time tracking. Track fulfillment across categories. Citizen-powered accountability platform.",
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
    "@type": "Organization",
    name: "The Manifesto",
    url: "https://manifesto.page",
    logo: "https://manifesto.page/manifesto-logo.png",
    description: "Citizen-powered accountability platform tracking BJP West Bengal manifesto promises",
    sameAs: [
      "https://twitter.com/observerfiles",
    ],
    contactPoint: {
      "@type": "ContactPoint",
      email: "toddwake666@gmail.com",
    },
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
