import { strict as assert } from "node:assert"
import { describe, it } from "node:test"
import type { APIGatewayProxyEventV2, APIGatewayProxyStructuredResultV2 } from "aws-lambda"
import { handler, parseContact } from "../lambda/contact"

const valid = { name: "Ada", email: "ada@example.com", message: "Hello!" }

describe("parseContact", () => {
  it("accepts and trims a valid message", () => {
    assert.deepEqual(parseContact({ name: " Ada ", email: "ada@example.com ", message: " Hello! " }), valid)
  })

  it("flags honeypot submissions as spam", () => {
    assert.equal(parseContact({ ...valid, company: "Acme" }), "spam")
  })

  for (const [label, body] of [
    ["missing name", { ...valid, name: "" }],
    ["bad email", { ...valid, email: "not-an-email" }],
    ["empty message", { ...valid, message: "   " }],
    ["oversized message", { ...valid, message: "x".repeat(5001) }],
    ["header injection in name", { ...valid, name: "Ada\r\nBcc: x@evil.test" }],
    ["non-object body", "hello"],
  ] as const) {
    it(`rejects ${label}`, () => {
      const result = parseContact(body)
      assert.ok(typeof result === "object" && "error" in result, JSON.stringify(result))
    })
  }
})

describe("handler", () => {
  const call = (body: string) =>
    handler({ body, isBase64Encoded: false } as APIGatewayProxyEventV2) as Promise<APIGatewayProxyStructuredResultV2>

  it("returns 400 for invalid JSON", async () => {
    assert.equal((await call("{nope")).statusCode, 400)
  })

  it("returns 400 for invalid fields", async () => {
    assert.equal((await call(JSON.stringify({ ...valid, email: "x" }))).statusCode, 400)
  })

  it("quietly accepts spam without sending", async () => {
    const res = await call(JSON.stringify({ ...valid, company: "bot" }))
    assert.equal(res.statusCode, 200)
  })
})
