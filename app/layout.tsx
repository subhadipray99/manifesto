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
    "Track every BJP manifesto promise for West Bengal. Citizen-powered accountability tracking fulfillment of election commitments.",
  generator: "v0.app",
  keywords: ["BJP", "West Bengal", "Promise Tracker", "Election", "Manifesto", "Accountability", "The Manifesto"],
  authors: [{ name: "ObserverFiles", url: "https://observerfiles.com" }],
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
    <ClerkProvider>
      <html lang="en" className={`${inter.variable} ${playfair.variable} bg-background`}>
        <body className="font-sans antialiased">
          {children}
          {process.env.NODE_ENV === "production" && <Analytics />}
        </body>
      </html>
    </ClerkProvider>
  )
}
