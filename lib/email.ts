import { Resend } from "resend"

import { neon } from "@neondatabase/serverless"

const resend = new Resend(process.env.RESEND_API_KEY || "re_123")

const FROM = "The Manifesto <notifications@manifesto.page>"
const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || "https://manifesto.page"

const getDb = () => neon(process.env.DATABASE_URL!)

// Returns whether a specific email notification type is enabled for a user.
// Defaults to true (opt-in) if no settings row exists yet.
export async function isEmailEnabled(
  userId: string,
  type: "email_on_update_approved" | "email_on_reply" | "email_on_followed_update",
): Promise<boolean> {
  try {
    const db = getDb()
    const rows = await db`SELECT ${db.unsafe(type)} FROM notification_settings WHERE user_id = ${userId} LIMIT 1`
    if (rows.length === 0) return true
    return rows[0][type] as boolean
  } catch {
    return true
  }
}

// ── Templates ────────────────────────────────────────────────────────────────

function baseTemplate(title: string, bodyHtml: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title}</title>
</head>
<body style="margin:0;padding:0;background:#f5f5f0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f0;padding:40px 16px;">
    <tr><td align="center">
      <table width="100%" style="max-width:560px;background:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #e5e5e0;">
        <!-- Header -->
        <tr>
          <td style="background:#ea580c;padding:24px 32px;">
            <p style="margin:0;font-size:18px;font-weight:900;color:#ffffff;letter-spacing:-0.5px;">
              The Manifesto
            </p>
            <p style="margin:4px 0 0;font-size:12px;color:#fed7aa;font-weight:500;text-transform:uppercase;letter-spacing:1px;">
              Citizen-powered accountability
            </p>
          </td>
        </tr>
        <!-- Body -->
        <tr>
          <td style="padding:32px;">
            ${bodyHtml}
          </td>
        </tr>
        <!-- Footer -->
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

function updateApprovedHtml(params: {
  recipientName: string
  updateTitle: string
  promiseTitle: string
  stateId: string
  promiseId: string
}): string {
  const url = `${BASE_URL}/${params.stateId}?promise=${params.promiseId}`
  return baseTemplate("Your update was approved", `
    <h2 style="margin:0 0 8px;font-size:22px;font-weight:900;color:#1a1a18;">
      Your update was approved!
    </h2>
    <p style="margin:0 0 24px;font-size:15px;color:#6b6b65;line-height:1.6;">
      Hi ${params.recipientName}, your evidence submission has been reviewed and approved by our team.
    </p>
    <div style="background:#fff7ed;border:1px solid #fed7aa;border-left:4px solid #ea580c;border-radius:8px;padding:16px 20px;margin-bottom:24px;">
      <p style="margin:0 0 4px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:#c2410c;">Approved Update</p>
      <p style="margin:0;font-size:15px;font-weight:700;color:#1a1a18;">${params.updateTitle}</p>
      <p style="margin:6px 0 0;font-size:13px;color:#78716c;">Re: ${params.promiseTitle}</p>
    </div>
    <p style="margin:0 0 24px;font-size:14px;color:#6b6b65;line-height:1.6;">
      Your contribution is now visible to all citizens tracking this promise. Thank you for helping hold our leaders accountable.
    </p>
    <a href="${url}" style="display:inline-block;background:#ea580c;color:#ffffff;font-size:14px;font-weight:700;text-decoration:none;padding:12px 24px;border-radius:8px;">
      View on The Manifesto
    </a>
  `)
}

function replyReceivedHtml(params: {
  recipientName: string
  replierName: string
  replyBody: string
  promiseTitle: string
  stateId: string
  promiseId: string
  commentId: string
}): string {
  const url = `${BASE_URL}/${params.stateId}?promise=${params.promiseId}#comment-${params.commentId}`
  const preview = params.replyBody.length > 200
    ? params.replyBody.slice(0, 200) + "…"
    : params.replyBody
  return baseTemplate("You got a reply", `
    <h2 style="margin:0 0 8px;font-size:22px;font-weight:900;color:#1a1a18;">
      ${params.replierName} replied to your comment
    </h2>
    <p style="margin:0 0 24px;font-size:15px;color:#6b6b65;line-height:1.6;">
      Hi ${params.recipientName}, someone replied to your comment on <strong>${params.promiseTitle}</strong>.
    </p>
    <div style="background:#f9f9f7;border:1px solid #e5e5e0;border-left:4px solid #6366f1;border-radius:8px;padding:16px 20px;margin-bottom:24px;">
      <p style="margin:0 0 4px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:#4f46e5;">${params.replierName} said</p>
      <p style="margin:0;font-size:14px;color:#3a3a36;line-height:1.6;">${preview}</p>
    </div>
    <a href="${url}" style="display:inline-block;background:#ea580c;color:#ffffff;font-size:14px;font-weight:700;text-decoration:none;padding:12px 24px;border-radius:8px;">
      View Reply
    </a>
  `)
}

function followedPromiseUpdateHtml(params: {
  recipientName: string
  promiseTitle: string
  updateTitle: string
  submittedBy: string
  stateId: string
  promiseId: string
}): string {
  const url = `${BASE_URL}/${params.stateId}?promise=${params.promiseId}`
  return baseTemplate("New update on a promise you follow", `
    <h2 style="margin:0 0 8px;font-size:22px;font-weight:900;color:#1a1a18;">
      New update on a promise you follow
    </h2>
    <p style="margin:0 0 24px;font-size:15px;color:#6b6b65;line-height:1.6;">
      Hi ${params.recipientName}, a new update has been submitted and approved for a promise you are tracking.
    </p>
    <div style="background:#fff7ed;border:1px solid #fed7aa;border-left:4px solid #ea580c;border-radius:8px;padding:16px 20px;margin-bottom:24px;">
      <p style="margin:0 0 4px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:#c2410c;">Promise</p>
      <p style="margin:0 0 12px;font-size:15px;font-weight:700;color:#1a1a18;">${params.promiseTitle}</p>
      <p style="margin:0 0 4px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:#c2410c;">New Update</p>
      <p style="margin:0 0 6px;font-size:14px;color:#3a3a36;">${params.updateTitle}</p>
      <p style="margin:0;font-size:12px;color:#78716c;">Submitted by ${params.submittedBy}</p>
    </div>
    <a href="${url}" style="display:inline-block;background:#ea580c;color:#ffffff;font-size:14px;font-weight:700;text-decoration:none;padding:12px 24px;border-radius:8px;">
      View Update
    </a>
    <p style="margin:24px 0 0;font-size:12px;color:#a0a09a;">
      To stop receiving these emails, go to your
      <a href="${BASE_URL}/settings" style="color:#ea580c;text-decoration:none;">notification settings</a>.
    </p>
  `)
}

// ── Senders ───────────────────────────────────────────────────────────────────

export async function sendUpdateApprovedEmail(params: {
  toEmail: string
  recipientName: string
  updateTitle: string
  promiseTitle: string
  stateId: string
  promiseId: string
}): Promise<void> {
  try {
    const { error } = await resend.emails.send({
      from: FROM,
      to: params.toEmail,
      subject: `Your update was approved — The Manifesto`,
      html: updateApprovedHtml(params),
    })
    if (error) throw new Error(error.message)
  } catch (err) {
    console.error("[v0] sendUpdateApprovedEmail failed:", err)
  }
}

export async function sendFollowedPromiseUpdateEmail(params: {
  toEmail: string
  recipientName: string
  promiseTitle: string
  updateTitle: string
  submittedBy: string
  stateId: string
  promiseId: string
}): Promise<void> {
  try {
    const { error } = await resend.emails.send({
      from: FROM,
      to: params.toEmail,
      subject: `New update on "${params.promiseTitle}" — The Manifesto`,
      html: followedPromiseUpdateHtml(params),
    })
    if (error) throw new Error(error.message)
  } catch (err) {
    console.error("[v0] sendFollowedPromiseUpdateEmail failed:", err)
  }
}

export async function sendReplyNotificationEmail(params: {
  toEmail: string
  recipientName: string
  replierName: string
  replyBody: string
  promiseTitle: string
  stateId: string
  promiseId: string
  commentId: string
}): Promise<void> {
  try {
    const { error } = await resend.emails.send({
      from: FROM,
      to: params.toEmail,
      subject: `${params.replierName} replied to your comment — The Manifesto`,
      html: replyReceivedHtml(params),
    })
    if (error) throw new Error(error.message)
  } catch (err) {
    console.error("[v0] sendReplyNotificationEmail failed:", err)
  }
}
