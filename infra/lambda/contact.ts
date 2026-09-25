import { SESv2Client, SendEmailCommand } from "@aws-sdk/client-sesv2"
import type { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from "aws-lambda"

const ses = new SESv2Client({})

const LIMITS = { name: 100, email: 254, message: 5000 }
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export interface ContactMessage {
  name: string
  email: string
  message: string
}

const json = (statusCode: number, body: Record<string, unknown>): APIGatewayProxyResultV2 => ({
  statusCode,
  headers: { "content-type": "application/json", "cache-control": "no-store" },
  body: JSON.stringify(body),
})

/** Returns the cleaned message, `"spam"` for bot submissions, or an error string. */
export function parseContact(raw: unknown): ContactMessage | "spam" | { error: string } {
  if (!raw || typeof raw !== "object") return { error: "Invalid request body." }
  const body = raw as Record<string, unknown>

  // Honeypot: the form hides this field from people, so only bots fill it in.
  if (typeof body.company === "string" && body.company.trim() !== "") return "spam"

  const str = (v: unknown) => (typeof v === "string" ? v.trim() : "")
  const name = str(body.name)
  const email = str(body.email)
  const message = str(body.message)

  if (!name || name.length > LIMITS.name) return { error: "Please enter your name." }
  if (!EMAIL_RE.test(email) || email.length > LIMITS.email) return { error: "Please enter a valid email." }
  if (!message || message.length > LIMITS.message) {
    return { error: `Please enter a message (up to ${LIMITS.message} characters).` }
  }
  // Header injection guard: name and email end up in email headers.
  if (/[\r\n]/.test(name) || /[\r\n]/.test(email)) return { error: "Invalid characters in name or email." }

  return { name, email, message }
}

export async function handler(event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> {
  let raw: unknown
  try {
    const text = event.isBase64Encoded ? Buffer.from(event.body ?? "", "base64").toString("utf8") : event.body
    raw = JSON.parse(text ?? "")
  } catch {
    return json(400, { error: "Invalid JSON." })
  }

  const parsed = parseContact(raw)
  // Pretend success so bots learn nothing.
  if (parsed === "spam") return json(200, { ok: true })
  if ("error" in parsed) return json(400, parsed)

  const { name, email, message } = parsed
  try {
    await ses.send(
      new SendEmailCommand({
        FromEmailAddress: process.env.FROM_EMAIL,
        Destination: { ToAddresses: [process.env.TO_EMAIL!] },
        ReplyToAddresses: [email],
        Content: {
          Simple: {
            Subject: { Data: `Portfolio message from ${name}`, Charset: "UTF-8" },
            Body: { Text: { Data: `${message}\n\n— ${name} <${email}>`, Charset: "UTF-8" } },
          },
        },
      }),
    )
  } catch (err) {
    console.error("SES send failed", err)
    return json(502, { error: "Could not send right now. Please email me directly." })
  }

  return json(200, { ok: true })
}
