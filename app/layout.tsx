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
  title: "The Manifesto | BJP West Bengal Promise Tracker",
  description:
    "Track every BJP manifesto promise for West Bengal. Monitor fulfillment of election commitments with real-time updates. Citizen-powered accountability platform.",
  generator: "v0.app",
  keywords: [
    "BJP",
    "West Bengal",
    "Promise Tracker",
    "Election Manifesto",
    "Accountability",
    "Political Promises",
    "Governance",
    "The Manifesto",
    "Bengal Elections",
    "Promise Fulfillment",
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
    title: "The Manifesto | BJP West Bengal Promise Tracker",
    description: "Track every BJP manifesto promise for West Bengal. Are they keeping their word? Find out now.",
    url: "https://themanifesto.vercel.app",
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
    title: "The Manifesto | BJP West Bengal Promise Tracker",
    description: "Track every BJP manifesto promise for West Bengal. Citizen-powered accountability.",
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
    canonical: "https://themanifesto.vercel.app",
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
  return (
    <html lang="en" className={`${inter.variable} ${playfair.variable} bg-background`}>
      <body className="font-sans antialiased">
        <ClerkProvider>
          {children}
          {process.env.NODE_ENV === "production" && <Analytics />}
        </ClerkProvider>
      </body>
    </html>
  )
}
