import { NextResponse } from "next/server"
import { validateContact } from "@/lib/contact"

// Delivers contact form messages by email through Resend (https://resend.com).
// The recipient lives only in the server environment, never in the site's code:
//   RESEND_API_KEY      API key from the Resend dashboard
//   CONTACT_TO_EMAIL    where messages are delivered
//   CONTACT_FROM_EMAIL  optional sender; defaults to Resend's shared test sender,
//                       which may only send to the address that owns the Resend account

export const runtime = "nodejs"

// Best-effort throttle per server instance: 5 messages per IP per 10 minutes.
const WINDOW_MS = 10 * 60 * 1000
const MAX_PER_WINDOW = 5
const hits = new Map<string, number[]>()

function rateLimited(ip: string, now: number) {
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < WINDOW_MS)
  recent.push(now)
  hits.set(ip, recent)
  if (hits.size > 5000) hits.clear()
  return recent.length > MAX_PER_WINDOW
}

export async function POST(request: Request) {
  const apiKey = process.env.RESEND_API_KEY
  const to = process.env.CONTACT_TO_EMAIL
  if (!apiKey || !to) {
    return NextResponse.json({ error: "The contact form isn't set up yet." }, { status: 503 })
  }

  const now = Date.now()
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown"
  if (rateLimited(ip, now)) {
    return NextResponse.json({ error: "Too many messages. Please try again later." }, { status: 429 })
  }

  let raw: unknown
  try {
    raw = await request.json()
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 })
  }

  const result = validateContact(raw, now)
  // Pretend success so bots learn nothing.
  if (!result.ok && "spam" in result) return NextResponse.json({ ok: true })
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: 400 })

  const { name, email, message } = result.message
  const failed = NextResponse.json({ error: "Couldn't send right now. Please try again later." }, { status: 502 })
  let res: Response
  try {
    res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: process.env.CONTACT_FROM_EMAIL || "Portfolio <onboarding@resend.dev>",
        to: [to],
        reply_to: email,
        subject: `Portfolio message from ${name}`,
        text: `${message}\n\n— ${name} <${email}>`,
      }),
    })
  } catch (err) {
    console.error("Resend request failed", err)
    return failed
  }

  if (!res.ok) {
    console.error("Resend error", res.status, await res.text().catch(() => ""))
    return failed
  }
  return NextResponse.json({ ok: true })
}
