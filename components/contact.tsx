"use client"

import { useEffect, useRef, useState } from "react"
import { ArrowUpRight } from "lucide-react"
import { site } from "@/lib/site"
import { Container, Reveal, SectionHeader } from "./primitives"

const inputClass =
  "w-full rounded-lg border border-site-line bg-site-panel px-4 py-3 text-sm text-site-fg placeholder:text-site-muted/70 outline-none transition-colors focus:border-site-accent"

const empty = { name: "", email: "", message: "", company: "" }

export function Contact() {
  const [form, setForm] = useState(empty)
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle")
  const [error, setError] = useState("")
  const startedAt = useRef(0)

  useEffect(() => {
    startedAt.current = Date.now()
  }, [])

  const update = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }))

  // Messages go through /api/contact, so the recipient address never appears on the site.
  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setStatus("sending")
    setError("")
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ ...form, startedAt: startedAt.current }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || "Something went wrong.")
      setStatus("sent")
      setForm(empty)
    } catch (err) {
      setStatus("error")
      setError(err instanceof Error ? err.message : "Something went wrong.")
    }
  }

  return (
    <section id="contact" className="border-t border-site-line py-24 md:py-32">
      <Container>
        <SectionHeader
          number="04"
          label="Contact"
          title={
            <>
              Let&apos;s build something <span className="font-serif font-normal italic text-site-accent">together</span>.
            </>
          }
          description="Have an idea, an architecture question, or just want to chat? Drop me a line."
        />

        <div className="grid gap-12 md:grid-cols-[12rem_1fr] md:gap-8">
          <div aria-hidden className="hidden md:block" />
          <div className="grid gap-12 lg:grid-cols-[1fr_1.2fr]">
            <Reveal className="space-y-8">
              <div>
                <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-site-muted">Message me</p>
                <p className="mt-2 text-xl font-medium md:text-2xl">The form goes straight to my inbox.</p>
                <p className="mt-2 text-site-muted">I read every message and usually reply within a few days.</p>
              </div>

              <div>
                <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-site-muted">Elsewhere</p>
                <ul className="mt-3 space-y-2">
                  {site.socials.map((s) => (
                    <li key={s.label}>
                      <a
                        href={s.href}
                        target="_blank"
                        rel="noreferrer"
                        className="group inline-flex items-center gap-2 text-lg transition-colors hover:text-site-accent"
                      >
                        {s.label}
                        <ArrowUpRight className="h-4 w-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            </Reveal>

            <Reveal delay={0.1}>
              <form onSubmit={submit} className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="block">
                    <span className="sr-only">Your name</span>
                    <input
                      name="name"
                      required
                      maxLength={100}
                      value={form.name}
                      onChange={update}
                      placeholder="Your name"
                      autoComplete="name"
                      className={inputClass}
                    />
                  </label>
                  <label className="block">
                    <span className="sr-only">Your email</span>
                    <input
                      name="email"
                      type="email"
                      required
                      maxLength={254}
                      value={form.email}
                      onChange={update}
                      placeholder="Your email"
                      autoComplete="email"
                      className={inputClass}
                    />
                  </label>
                </div>
                <label className="block">
                  <span className="sr-only">Message</span>
                  <textarea
                    name="message"
                    required
                    maxLength={5000}
                    rows={5}
                    value={form.message}
                    onChange={update}
                    placeholder="What's on your mind?"
                    className={`${inputClass} resize-none`}
                  />
                </label>
                {/* Honeypot: hidden from people, filled in by bots. */}
                <input
                  name="company"
                  value={form.company}
                  onChange={update}
                  tabIndex={-1}
                  autoComplete="off"
                  aria-hidden="true"
                  className="hidden"
                />
                <button
                  type="submit"
                  disabled={status === "sending"}
                  className="group inline-flex w-full items-center justify-center gap-2 rounded-lg bg-site-accent px-5 py-3 text-sm font-medium text-black transition-opacity hover:opacity-90 disabled:opacity-60"
                >
                  {status === "sending" ? "Sending…" : "Send message"}
                  <ArrowUpRight className="h-4 w-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                </button>
                <p
                  className={`text-center font-mono text-[11px] ${status === "error" ? "text-red-500" : status === "sent" ? "text-site-accent" : "text-site-muted"}`}
                  aria-live="polite"
                >
                  {status === "sent"
                    ? "Thanks! Your message is on its way. I'll get back to you soon."
                    : status === "error"
                      ? error
                      : "Your email is only used to reply to you."}
                </p>
              </form>
            </Reveal>
          </div>
        </div>
      </Container>
    </section>
  )
}
