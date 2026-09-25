// Contact form validation, shared by the form and the /api/contact route.

export const CONTACT_LIMITS = { name: 100, email: 254, message: 5000 }

// A person takes a few seconds to write a message; bots submit instantly.
export const MIN_FILL_MS = 3000

export interface ContactMessage {
  name: string
  email: string
  message: string
}

export type ContactResult = { ok: true; message: ContactMessage } | { ok: false; spam: true } | { ok: false; error: string }

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function validateContact(raw: unknown, now = Date.now()): ContactResult {
  if (!raw || typeof raw !== "object") return { ok: false, error: "Invalid request." }
  const body = raw as Record<string, unknown>

  // Honeypot: the form hides this field from people, so only bots fill it in.
  if (typeof body.company === "string" && body.company.trim() !== "") return { ok: false, spam: true }
  if (typeof body.startedAt === "number" && now - body.startedAt < MIN_FILL_MS) return { ok: false, spam: true }

  const str = (v: unknown) => (typeof v === "string" ? v.trim() : "")
  const name = str(body.name)
  const email = str(body.email)
  const message = str(body.message)

  if (!name || name.length > CONTACT_LIMITS.name) return { ok: false, error: "Please enter your name." }
  if (!EMAIL_RE.test(email) || email.length > CONTACT_LIMITS.email) {
    return { ok: false, error: "Please enter a valid email address." }
  }
  if (!message || message.length > CONTACT_LIMITS.message) {
    return { ok: false, error: `Please enter a message (up to ${CONTACT_LIMITS.message} characters).` }
  }
  // Name and email end up in email headers; block header injection.
  if (/[\r\n]/.test(name) || /[\r\n]/.test(email)) return { ok: false, error: "Invalid characters in name or email." }

  return { ok: true, message: { name, email, message } }
}
