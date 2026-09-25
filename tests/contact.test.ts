import { strict as assert } from "node:assert"
import { describe, it } from "node:test"
import { MIN_FILL_MS, validateContact } from "../lib/contact.ts"

const now = 1_000_000
const valid = { name: "Ada", email: "ada@example.com", message: "Hello!", startedAt: now - 10_000 }

describe("validateContact", () => {
  it("accepts and trims a valid message", () => {
    assert.deepEqual(validateContact({ ...valid, name: " Ada " }, now), {
      ok: true,
      message: { name: "Ada", email: "ada@example.com", message: "Hello!" },
    })
  })

  it("flags the honeypot as spam", () => {
    assert.deepEqual(validateContact({ ...valid, company: "Acme" }, now), { ok: false, spam: true })
  })

  it("flags instant submissions as spam", () => {
    assert.deepEqual(validateContact({ ...valid, startedAt: now - MIN_FILL_MS + 1 }, now), { ok: false, spam: true })
  })

  for (const [label, body] of [
    ["missing name", { ...valid, name: "" }],
    ["bad email", { ...valid, email: "nope" }],
    ["empty message", { ...valid, message: "  " }],
    ["oversized message", { ...valid, message: "x".repeat(5001) }],
    ["header injection", { ...valid, name: "Ada\r\nBcc: x@evil.test" }],
    ["non-object body", "hi"],
  ] as const) {
    it(`rejects ${label}`, () => {
      const r = validateContact(body, now)
      assert.ok(!r.ok && "error" in r, JSON.stringify(r))
    })
  }
})
