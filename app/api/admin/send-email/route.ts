import { NextRequest, NextResponse } from "next/server"
import { auth, clerkClient } from "@clerk/nextjs/server"
import { Resend } from "resend"

const ADMIN_IDS = (process.env.ADMIN_USER_IDS || "").split(",").map((s) => s.trim()).filter(Boolean)
const resend = new Resend(process.env.RESEND_API_KEY || "re_123")
const FROM = "The Manifesto <notifications@manifesto.page>"
const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || "https://manifesto.page"

function buildHtml(subject: string, body: string): string {
  const escaped = body
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .split("\n")
    .map((l) => `<p style="margin:0 0 12px;font-size:15px;color:#3a3a36;line-height:1.7;">${l || "&nbsp;"}</p>`)
    .join("")

  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1.0"/><title>${subject}</title></head>
<body style="margin:0;padding:0;background:#f5f5f0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f0;padding:40px 16px;">
    <tr><td align="center">
      <table width="100%" style="max-width:560px;background:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #e5e5e0;">
        <tr>
          <td style="background:#ea580c;padding:24px 32px;">
            <p style="margin:0;font-size:18px;font-weight:900;color:#ffffff;letter-spacing:-0.5px;">The Manifesto</p>
            <p style="margin:4px 0 0;font-size:12px;color:#fed7aa;font-weight:500;text-transform:uppercase;letter-spacing:1px;">Citizen-powered accountability</p>
          </td>
        </tr>
        <tr>
          <td style="padding:32px;">
            <h2 style="margin:0 0 20px;font-size:22px;font-weight:900;color:#1a1a18;">${subject}</h2>
            ${escaped}
          </td>
        </tr>
        <tr>
          <td style="padding:16px 32px 24px;border-top:1px solid #f0f0eb;">
            <p style="margin:0;font-size:11px;color:#a0a09a;text-align:center;">
              You received this because you have an account on
              <a href="${BASE_URL}" style="color:#ea580c;text-decoration:none;">The Manifesto</a>.
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`
}

export async function POST(req: NextRequest) {
  const { userId } = await auth()
  if (!userId || !ADMIN_IDS.includes(userId)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const { subject, body, recipientType, specificUserIds } = await req.json()

  if (!subject?.trim() || !body?.trim()) {
    return NextResponse.json({ error: "Subject and body are required" }, { status: 400 })
  }

  try {
    const client = await clerkClient()
    let targetUserIds: string[] = []

    if (recipientType === "all") {
      // Fetch all users in batches
      let offset = 0
      const limit = 100
      while (true) {
        const page = await client.users.getUserList({ limit, offset })
        targetUserIds.push(...page.data.map((u) => u.id))
        if (page.data.length < limit) break
        offset += limit
      }
    } else if (recipientType === "specific" && Array.isArray(specificUserIds)) {
      targetUserIds = specificUserIds
    } else {
      return NextResponse.json({ error: "Invalid recipientType" }, { status: 400 })
    }

    // Fetch emails for all target users
    const results: { userId: string; email: string; name: string; status: "sent" | "failed" | "no_email" }[] = []
    const html = buildHtml(subject.trim(), body.trim())

    for (const uid of targetUserIds) {
      try {
        const user = await client.users.getUser(uid)
        const email = user.emailAddresses?.[0]?.emailAddress
        if (!email) { results.push({ userId: uid, email: "", name: "", status: "no_email" }); continue }
        const name = user.fullName || user.firstName || email

        const { error } = await resend.emails.send({ from: FROM, to: email, subject: subject.trim(), html })
        if (error) {
          console.error("[v0] Resend error:", error)
          throw new Error(error.message)
        }
        results.push({ userId: uid, email, name, status: "sent" })
      } catch {
        results.push({ userId: uid, email: "", name: "", status: "failed" })
      }
    }

    const sent = results.filter((r) => r.status === "sent").length
    const failed = results.filter((r) => r.status === "failed").length
    const noEmail = results.filter((r) => r.status === "no_email").length

    return NextResponse.json({ success: true, sent, failed, noEmail, total: targetUserIds.length, results })
  } catch (err) {
    console.error("[v0] Admin send-email error:", err)
    return NextResponse.json({ error: "Failed to send emails" }, { status: 500 })
  }
}

// GET — search users for the recipient picker
export async function GET(req: NextRequest) {
  const { userId } = await auth()
  if (!userId || !ADMIN_IDS.includes(userId)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }
  const query = req.nextUrl.searchParams.get("q") || ""
  try {
    const client = await clerkClient()
    const page = await client.users.getUserList({ query, limit: 20 })
    const users = page.data.map((u) => ({
      id: u.id,
      name: u.fullName || u.firstName || u.emailAddresses?.[0]?.emailAddress || u.id,
      email: u.emailAddresses?.[0]?.emailAddress || "",
      imageUrl: u.imageUrl,
    }))
    return NextResponse.json({ users })
  } catch (err) {
    return NextResponse.json({ error: "Failed to search users" }, { status: 500 })
  }
}
