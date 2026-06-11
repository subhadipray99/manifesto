import { Resend } from "resend"

const resend = new Resend(process.env.RESEND_API_KEY)

const FROM = "The Manifesto <notifications@themanifesto.in>"
const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || "https://themanifesto.in"

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
    await resend.emails.send({
      from: FROM,
      to: params.toEmail,
      subject: `Your update was approved — The Manifesto`,
      html: updateApprovedHtml(params),
    })
  } catch (err) {
    console.error("[v0] sendUpdateApprovedEmail failed:", err)
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
    await resend.emails.send({
      from: FROM,
      to: params.toEmail,
      subject: `${params.replierName} replied to your comment — The Manifesto`,
      html: replyReceivedHtml(params),
    })
  } catch (err) {
    console.error("[v0] sendReplyNotificationEmail failed:", err)
  }
}
