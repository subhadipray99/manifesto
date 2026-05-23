import { Metadata } from "next"

export const metadata: Metadata = {
  title: "Privacy Policy | The Manifesto",
  description: "Privacy policy for The Manifesto - BJP West Bengal Promise Tracker",
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    title: "Privacy Policy | The Manifesto",
    description: "Privacy policy for The Manifesto - BJP West Bengal Promise Tracker",
    url: "https://themanifesto.vercel.app/privacy",
    type: "website",
  },
}

export default function PrivacyPage() {
  return (
    <main className="min-h-dvh bg-background">
      {/* Header */}
      <header className="border-b-4 border-green-600 bg-orange-600 px-4 py-6 sm:px-6">
        <div className="mx-auto max-w-4xl">
          <h1 className="text-3xl font-black text-white">Privacy Policy</h1>
          <p className="mt-2 text-white/90">Last updated: {new Date().toLocaleDateString()}</p>
        </div>
      </header>

      {/* Content */}
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 sm:py-12">
        <div className="prose prose-sm max-w-none space-y-8 text-foreground dark:prose-invert">
          {/* Introduction */}
          <section>
            <h2 className="text-2xl font-bold text-foreground">Introduction</h2>
            <p className="mt-4 text-muted-foreground">
              The Manifesto ("we," "us," "our," or "Company") operates themanifesto.vercel.app. This page informs you of our policies regarding the collection, use, and disclosure of personal data when you use our Service and the choices you have associated with that data.
            </p>
          </section>

          {/* Information Collection */}
          <section>
            <h2 className="text-2xl font-bold text-foreground">Information We Collect</h2>
            <div className="mt-4 space-y-4">
              <div>
                <h3 className="font-bold text-foreground">Personal Information</h3>
                <p className="mt-2 text-muted-foreground">
                  When you create an account or submit updates, we collect information you provide directly, such as:
                </p>
                <ul className="mt-2 list-inside list-disc space-y-2 text-muted-foreground">
                  <li>Name and email address</li>
                  <li>Authentication credentials</li>
                  <li>User-submitted updates and contributions</li>
                </ul>
              </div>

              <div>
                <h3 className="font-bold text-foreground">Automatically Collected Information</h3>
                <p className="mt-2 text-muted-foreground">
                  When you use our Service, we automatically collect certain information about your device and usage:
                </p>
                <ul className="mt-2 list-inside list-disc space-y-2 text-muted-foreground">
                  <li>IP address and browser type</li>
                  <li>Pages visited and time spent on the site</li>
                  <li>Referral source and device information</li>
                  <li>Cookies and similar tracking technologies</li>
                </ul>
              </div>
            </div>
          </section>

          {/* How We Use Information */}
          <section>
            <h2 className="text-2xl font-bold text-foreground">How We Use Your Information</h2>
            <p className="mt-4 text-muted-foreground">We use the collected information for:</p>
            <ul className="mt-4 list-inside list-disc space-y-2 text-muted-foreground">
              <li>Providing and maintaining the Service</li>
              <li>Processing and managing user contributions and updates</li>
              <li>Sending service-related announcements and updates</li>
              <li>Responding to your inquiries and support requests</li>
              <li>Analyzing usage patterns to improve our Service</li>
              <li>Enforcing our Terms of Service and other agreements</li>
              <li>Preventing fraudulent activity and securing the platform</li>
            </ul>
          </section>

          {/* Data Security */}
          <section>
            <h2 className="text-2xl font-bold text-foreground">Data Security</h2>
            <p className="mt-4 text-muted-foreground">
              We implement appropriate technical and organizational measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction. However, no method of transmission over the internet or electronic storage is 100% secure. While we strive to use commercially acceptable means to protect your personal information, we cannot guarantee its absolute security.
            </p>
          </section>

          {/* Data Retention */}
          <section>
            <h2 className="text-2xl font-bold text-foreground">Data Retention</h2>
            <p className="mt-4 text-muted-foreground">
              We retain your personal information for as long as your account is active or as needed to provide you with the Service. You can request deletion of your personal data at any time by contacting us at the email address below.
            </p>
          </section>

          {/* Third-Party Services */}
          <section>
            <h2 className="text-2xl font-bold text-foreground">Third-Party Services</h2>
            <p className="mt-4 text-muted-foreground">
              Our Service may contain links to third-party websites and services that are not operated by us. This Privacy Policy does not apply to third-party services, and we are not responsible for their privacy practices. We encourage you to review the privacy policies of any third-party services before providing your information.
            </p>
          </section>

          {/* User Rights */}
          <section>
            <h2 className="text-2xl font-bold text-foreground">Your Rights</h2>
            <p className="mt-4 text-muted-foreground">You have the right to:</p>
            <ul className="mt-4 list-inside list-disc space-y-2 text-muted-foreground">
              <li>Access the personal information we hold about you</li>
              <li>Correct inaccurate or incomplete information</li>
              <li>Request deletion of your personal information</li>
              <li>Object to certain processing of your data</li>
              <li>Withdraw consent at any time</li>
              <li>Opt-out of marketing communications</li>
            </ul>
          </section>

          {/* Children's Privacy */}
          <section>
            <h2 className="text-2xl font-bold text-foreground">Children's Privacy</h2>
            <p className="mt-4 text-muted-foreground">
              Our Service is not directed to children under 13 years of age. We do not knowingly collect personal information from children under 13. If we become aware that a child under 13 has provided us with personal information, we will promptly delete such information from our systems.
            </p>
          </section>

          {/* Cookies */}
          <section>
            <h2 className="text-2xl font-bold text-foreground">Cookies and Tracking</h2>
            <p className="mt-4 text-muted-foreground">
              We use cookies and similar tracking technologies to track activity on our Service and hold certain information. You can instruct your browser to refuse all cookies or to indicate when a cookie is being sent. However, if you do not accept cookies, you may not be able to use some portions of our Service.
            </p>
          </section>

          {/* Changes to Policy */}
          <section>
            <h2 className="text-2xl font-bold text-foreground">Changes to This Policy</h2>
            <p className="mt-4 text-muted-foreground">
              We may update our Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the "Last updated" date at the top of this policy. Your continued use of the Service following the posting of revised Privacy Policy means that you accept and agree to the changes.
            </p>
          </section>

          {/* Contact Information */}
          <section>
            <h2 className="text-2xl font-bold text-foreground">Contact Us</h2>
            <p className="mt-4 text-muted-foreground">
              If you have any questions about this Privacy Policy, please contact us at:
            </p>
            <div className="mt-4 rounded-lg bg-muted/50 p-4">
              <p className="font-semibold text-foreground">The Manifesto</p>
              <p className="mt-2 text-sm text-muted-foreground">
                Email:{" "}
                <a href="mailto:toddwake666@gmail.com" className="text-orange-600 hover:text-orange-700">
                  toddwake666@gmail.com
                </a>
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                Website:{" "}
                <a href="https://themanifesto.vercel.app" className="text-orange-600 hover:text-orange-700">
                  themanifesto.vercel.app
                </a>
              </p>
            </div>
          </section>

          {/* Compliance */}
          <section>
            <h2 className="text-2xl font-bold text-foreground">Legal Compliance</h2>
            <p className="mt-4 text-muted-foreground">
              This Privacy Policy is compliant with GDPR, CCPA, and other applicable data protection regulations. We are committed to protecting your privacy and ensuring you have a positive experience on our platform.
            </p>
          </section>
        </div>
      </div>
    </main>
  )
}
